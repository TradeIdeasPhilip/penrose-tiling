import {
  CanvasAdapter,
  Point,
  Segment,
  Shape,
  Vertex,
  VertexGroup,
} from "./penrose.js";

import { getById } from "./library/typescript/client/client-misc.js";

const addKiteButton = getById("addKiteButton", HTMLButtonElement);
const addDartButton = getById("addDartButton", HTMLButtonElement);
const doForcedMovesButton = getById("doForcedMovesButton", HTMLButtonElement);
const selectPrevious = getById("selectPrevious", HTMLButtonElement);
const selectNext = getById("selectNext", HTMLButtonElement);

const canvasAdapter = new CanvasAdapter("canvas");
canvasAdapter.makeBitmapMatchElement();
const context = canvasAdapter.context;

/**
 * @param  input
 * @returns The first item of the given input.  Or undefined if the input is empty.
 */
function pickFirst<T>(input: Set<T>): T | undefined {
  const container = input.values().next();
  if (container.done) {
    return undefined;
  } else {
    return container.value;
  }
}

/**
 * @param  input
 * @returns An item from the given input.  Or undefined if the input is empty.
 */
function pickAny<T>(input: Set<T>): T | undefined {
  return pickFirst(input);
}

/**
 * @param  input
 * @returns The last item from the given input.  Or undefined if the input is empty.
 */
function pickLast<T>(input: Set<T>): T | undefined {
  let result: T | undefined;
  for (result of input);
  return result;
}

/**
 * This is the list of segments where we could add a new shape.
 * - Mostly this is used as a set, where you can ask for a list of all members, and you can ask if an element is still present.
 * - Deletes are handled completely internally.  When you try to add an item, this might delete the complementary item, instead.
 * - This is also responsible for iterating each time the user hits the next or previous button.
 */
class Available {
  private readonly available = new Set<Segment>();

  /**
   * The selected item.
   *
   * Invariant:  If available is empty, selection is undefined.
   * Otherwise selection is in available.
   */
  private selection: Segment | undefined;

  constructor(public readonly onChange: () => void) {}

  private delete(segment: Segment) {
    this.available.delete(segment);
    if (this.selection == segment) {
      // If we deleted the currently selected item, change the selection to be the most recently added item.
      // If you add a shape at the current selection then typically some part of the new shape is selected.
      // If that's not possible we just pick one.
      this.selection = pickLast(this.available);
    }
    if (!this.selection) {
      throw new Error("wtf");
    }
  }

  add(toAdd: Segment | Iterable<Segment> | Shape) {
    if (toAdd instanceof Segment) {
      toAdd = [toAdd];
    } else if (toAdd instanceof Shape) {
      toAdd = toAdd.segments;
    }
    for (const segmentToAdd of toAdd) {
      let toDelete: Segment | undefined;
      for (const existingSegment of this.available) {
        if (existingSegment.complements(segmentToAdd)) {
          toDelete = existingSegment;
          break;
        }
      }
      if (toDelete) {
        // We tried to add a particle and its antiparticle so they instantly annihilate each other in a burst of pure energy.
        this.delete(toDelete);
        // It's tempting to set the forcedMove property of each piece to be the type of the other piece.
        // It's not really required, but it might be used in some assertions in VertexGroup.
        // The problem is that we haven't saved the shapes so we don't have access to the info we need here.
      } else {
        this.selection ??= segmentToAdd;
        this.available.add(segmentToAdd);
      }
    }
    this.onChange();
  }

  has(segment: Segment) {
    return this.available.has(segment);
  }

  get empty() {
    return this.available.size == 0;
  }

  [Symbol.iterator]() {
    return this.available.values();
  }

  /**
   * Like Array.prototype.some().
   * @param predicate This will be called on each segment until one returns true.
   * @returns true if and only if the predicate returned true at least once.
   */
  some(predicate: (segment: Segment) => boolean): boolean {
    for (const segment of this.available) {
      if (predicate(segment)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Like Array.prototype.find().
   * @param predicate This will be called on each segment until one returns true.
   * @returns The first segment that matches the predicate.
   * Or undefined if nothing matched.
   */
  find(predicate: (segment: Segment) => boolean) {
    for (const segment of this.available) {
      if (predicate(segment)) {
        return segment;
      }
    }
    return;
  }

  /**
   * Similar to Array.prototype.filter().
   * @param predicate Include items that make this true.
   * @returns A new array containing all matching segments.
   * This is a snapshot that will not change even if the Available object changes.
   */
  filter(predicate: (segment: Segment) => boolean): Segment[] {
    const result: Segment[] = [];
    for (const segment of this.available) {
      if (predicate(segment)) {
        result.push(segment);
      }
    }
    return result;
  }

  getSelection() {
    return this.selection;
  }

  selectNext() {
    if (!this.selection) {
      // This list is empty!  Nothing to select.
      return;
    }
    // This algorithm has a lot of issues.
    // We are trying to go around the object in an obvious way.
    // We are just moving one segment clockwise or counterclockwise.
    // This will fail if the shape touches itself, even in just a single point.
    const nextPoint = this.selection.to;
    const nextSegment = this.find((segment) => segment.from == nextPoint);
    if (!nextSegment) {
      throw new Error("wtf");
    }
    this.selection = nextSegment;
    this.onChange();
  }

  selectPrevious() {
    if (!this.selection) {
      // This list is empty!  Nothing to select.
      return;
    }
    const nextPoint = this.selection.from;
    const previousSegment = this.find((segment) => segment.to == nextPoint);
    if (!previousSegment) {
      throw new Error("wtf");
    }
    this.selection = previousSegment;
    this.onChange();
  }
}

function updateGuiToMatchAvailable() {
  let forcedMovesFound = false;
  const empty: boolean = available.empty;
  selectPrevious.disabled = empty;
  selectNext.disabled = empty;
  if (empty) {
    addDartButton.disabled = false;
    addKiteButton.disabled = false;
  } else {
    const byColor = {
      forceKite: [] as Segment[],
      forceDart: [] as Segment[],
      available: [] as Segment[],
    };
    for (const segment of available) {
      let type: keyof typeof byColor;
      switch (segment.forcedMove) {
        case "dart": {
          type = "forceDart";
          forcedMovesFound = true;
          break;
        }
        case "kite": {
          type = "forceKite";
          forcedMovesFound = true;
          break;
        }
        default: {
          type = "available";
          break;
        }
      }
      byColor[type].push(segment);
    }
    function draw(color: string, segments: Segment[]) {
      canvasAdapter.drawSegments(segments, color, innerLineWidth);
    }
    draw("darkkhaki", byColor.available);
    draw(bodyColor.kite, byColor.forceKite);
    draw(bodyColor.dart, byColor.forceDart);
    const selectedSegment = available.getSelection();
    if (!selectedSegment) {
      throw new Error("wtf");
    }
    context.setLineDash([innerLineWidth, innerLineWidth * 2.1]);
    draw("yellow", [selectedSegment]);
    context.setLineDash([]);
    addDartButton.disabled = selectedSegment.forcedMove == "kite";
    addKiteButton.disabled = selectedSegment.forcedMove == "dart";
  }
  doForcedMovesButton.disabled = !forcedMovesFound;
}

const bodyColor = { kite: "#F0F", dart: "#0FF" } as const;
const totalLineWidth = 12;
const innerLineWidth = 6;

function add(type: "kite" | "dart", initialSegment?: Segment) {
  initialSegment ??= available.getSelection();
  const newSegment = initialSegment
    ? initialSegment.invert()
    : Segment.create();
  const dart = type == "dart";
  const shape = Shape[dart ? "createDart" : "createKite"](newSegment);
  canvasAdapter.makeClosedPolygon(shape.points);
  context.fillStyle = bodyColor[type];
  context.fill();
  context.strokeStyle = "black";
  context.lineWidth = totalLineWidth;
  context.lineJoin = "round";
  context.stroke();
  VertexGroup.addShape(shape);
  available.add(shape);
}

addKiteButton.addEventListener("click", () => {
  add("kite");
});

addDartButton.addEventListener("click", () => {
  add("dart");
});

selectPrevious.addEventListener("click", () => {
  available.selectPrevious();
});

selectNext.addEventListener("click", () => {
  available.selectNext();
});

doForcedMovesButton.addEventListener("click", () => {
  // We are going to be changing the list as we iterate over the list!
  // For every segment *currently* in available that has a forced move, we want to make that move.
  // Some segments will disappear from available because two segments wanted to make the same forced move.
  // If this function creates new forced moves, do *not* make those moves yet, leave them in available.
  const inInitialList = available.filter((segment) => !!segment.forcedMove);
  inInitialList.forEach((segment) => {
    if (available.has(segment)) {
      const type = segment.forcedMove;
      if (!type) {
        throw new Error("wtf");
      }
      add(type, segment);
    }
  });
});

const available: Available = new Available(updateGuiToMatchAvailable);
updateGuiToMatchAvailable();

document.addEventListener("keydown", (ev) => {
  if (ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey) {
    return;
  }
  switch (ev.code) {
    case "ArrowLeft": {
      selectPrevious.click();
      ev.cancelBubble = true;
      break;
    }
    case "ArrowRight": {
      selectNext.click();
      ev.cancelBubble = true;
      break;
    }
    case "KeyK": {
      addKiteButton.click();
      ev.cancelBubble = true;
      break;
    }
    case "KeyD": {
      addDartButton.click();
      ev.cancelBubble = true;
      break;
    }
    case "KeyF": {
      doForcedMovesButton.click();
      ev.cancelBubble = true;
      break;
    }
  }
});

// For the JavaScript console.
(window as any).Index = { available, canvasAdapter };
