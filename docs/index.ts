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
      this.selection = pickAny(this.available);
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
   * Like Array.prototype.some.
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
    if (this.empty) {
      return;
    }
    let selectNext = false;
    for (const segment of this.available) {
      if (selectNext) {
        selectNext = false;
        this.selection = segment;
        break;
      }
      if (segment == this.selection) {
        selectNext = true;
      }
    }
    if (selectNext) {
      // The selection was the last item so we wrap around.
      this.selection = pickFirst(this.available);
    }
    this.onChange();
  }

  selectPrevious() {
    if (this.empty) {
      return;
    }
    let previous: Segment | undefined;
    for (const segment of this.available) {
      if (segment == this.selection) {
        break;
      }
      previous = segment;
    }
    this.selection = previous ?? pickLast(this.available);
    this.onChange();
  }
}

function updateGuiToMatchAvailable() {
  doForcedMovesButton.disabled = !available.some(
    (segment) => !!segment.forcedMove
  );
  const empty: boolean = available.empty;
  selectPrevious.disabled = empty;
  selectNext.disabled = empty;
  if (empty) {
    addDartButton.disabled = false;
    addKiteButton.disabled = false;
  } else {
    const selectedSegment = available.getSelection();
    if (!selectedSegment) {
      throw new Error("wtf");
    }
    context.beginPath();
    context.strokeStyle = "#080";
    context.lineWidth = 4.5;
    for (const segment of available) {
      if (segment != selectedSegment) {
        canvasAdapter.addToPath(segment);
      }
    }
    context.stroke();
    context.beginPath();
    context.strokeStyle = "#AFA";
    canvasAdapter.addToPath(selectedSegment);
    addDartButton.disabled = selectedSegment.forcedMove == "kite";
    addKiteButton.disabled = selectedSegment.forcedMove == "dart";
    context.stroke();
  }
}

function add(type: "kite" | "dart", initialSegment?: Segment) {
  initialSegment ??= available.getSelection();
  const newSegment = initialSegment
    ? initialSegment.invert()
    : Segment.create();
  const dart = type == "dart";
  const shape = Shape[dart ? "createDart" : "createKite"](newSegment);
  canvasAdapter.makeClosedPolygon(shape.points);
  context.fillStyle = dart ? "#0FF" : "#F0F";
  context.fill();
  context.strokeStyle = "black";
  context.lineWidth = 9.6;
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
