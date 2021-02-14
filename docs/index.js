import { CanvasAdapter, Segment, Shape, VertexGroup, } from "./penrose.js";
import { getById } from "./library/typescript/client/client-misc.js";
const addKiteButton = getById("addKiteButton", HTMLButtonElement);
const addDartButton = getById("addDartButton", HTMLButtonElement);
const doForcedMovesButton = getById("doForcedMovesButton", HTMLButtonElement);
const selectPrevious = getById("selectPrevious", HTMLButtonElement);
const selectNext = getById("selectNext", HTMLButtonElement);
const canvasAdapter = new CanvasAdapter("canvas");
canvasAdapter.makeBitmapMatchElement();
const context = canvasAdapter.context;
function pickFirst(input) {
    const container = input.values().next();
    if (container.done) {
        return undefined;
    }
    else {
        return container.value;
    }
}
function pickAny(input) {
    return pickFirst(input);
}
function pickLast(input) {
    let result;
    for (result of input)
        ;
    return result;
}
class Available {
    constructor(onChange) {
        this.onChange = onChange;
        this.available = new Set();
    }
    delete(segment) {
        this.available.delete(segment);
        if (this.selection == segment) {
            this.selection = pickAny(this.available);
        }
    }
    add(toAdd) {
        if (toAdd instanceof Segment) {
            toAdd = [toAdd];
        }
        else if (toAdd instanceof Shape) {
            toAdd = toAdd.segments;
        }
        for (const segmentToAdd of toAdd) {
            let toDelete;
            for (const existingSegment of this.available) {
                if (existingSegment.complements(segmentToAdd)) {
                    toDelete = existingSegment;
                    break;
                }
            }
            if (toDelete) {
                this.delete(toDelete);
            }
            else {
                this.selection ??= segmentToAdd;
                this.available.add(segmentToAdd);
            }
        }
        this.onChange();
    }
    has(segment) {
        return this.available.has(segment);
    }
    get empty() {
        return this.available.size == 0;
    }
    [Symbol.iterator]() {
        return this.available.values();
    }
    some(predicate) {
        for (const segment of this.available) {
            if (predicate(segment)) {
                return true;
            }
        }
        return false;
    }
    filter(predicate) {
        const result = [];
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
            this.selection = pickFirst(this.available);
        }
        this.onChange();
    }
    selectPrevious() {
        if (this.empty) {
            return;
        }
        let previous;
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
    let forcedMovesFound = false;
    for (const segment of available) {
        if (segment.forcedMove) {
            forcedMovesFound = true;
            context.beginPath();
            context.strokeStyle = bodyColor[segment.forcedMove];
            context.lineWidth = totalLineWidth;
            canvasAdapter.addToPath(segment);
            context.stroke();
        }
    }
    doForcedMovesButton.disabled = !forcedMovesFound;
    const empty = available.empty;
    selectPrevious.disabled = empty;
    selectNext.disabled = empty;
    if (empty) {
        addDartButton.disabled = false;
        addKiteButton.disabled = false;
    }
    else {
        const selectedSegment = available.getSelection();
        if (!selectedSegment) {
            throw new Error("wtf");
        }
        context.beginPath();
        context.strokeStyle = "darkkhaki";
        context.lineWidth = innerLineWidth;
        for (const segment of available) {
            if (segment != selectedSegment) {
                canvasAdapter.addToPath(segment);
            }
        }
        context.stroke();
        context.beginPath();
        context.strokeStyle = "yellow";
        canvasAdapter.addToPath(selectedSegment);
        addDartButton.disabled = selectedSegment.forcedMove == "kite";
        addKiteButton.disabled = selectedSegment.forcedMove == "dart";
        context.stroke();
    }
}
const bodyColor = { kite: "#F0F", dart: "#0FF" };
const totalLineWidth = 12;
const innerLineWidth = 4.5;
function add(type, initialSegment) {
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
const available = new Available(updateGuiToMatchAvailable);
updateGuiToMatchAvailable();
//# sourceMappingURL=index.js.map