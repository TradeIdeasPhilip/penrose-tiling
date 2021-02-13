import {CanvasAdapter, Point, Segment, Shape} from "./penrose.js";

import {getById} from "./library/typescript/client/client-misc.js";

const addKiteButton = getById("addKiteButton", HTMLButtonElement);
const addDartButton = getById("addDartButton", HTMLButtonElement);
const range = getById("range", HTMLInputElement);
const selectPrevious = getById("selectPrevious", HTMLButtonElement);
const selectNext = getById("selectNext", HTMLButtonElement);

const canvasAdapter = new CanvasAdapter("canvas");
canvasAdapter.makeBitmapMatchElement();
const context = canvasAdapter.context;

const available : Segment[] = [];

function addToAvailable(toAdd : Segment | readonly Segment[] | Shape) {
  if (toAdd instanceof Segment) {
    toAdd = [toAdd];
  } else if (toAdd instanceof Shape) {
    toAdd = toAdd.segments;
  }
  for (const segmentToAdd of toAdd) {
    const index = available.findIndex(segmentToAdd.complements, segmentToAdd);
    if (index < 0) {
      available.push(segmentToAdd);
    } else {
      available.splice(index, 1);
    }
  }
  updateGuiToMatchAvailable();
}

function getSelectedIndex() : number {
  return parseInt(range.value);
}

function setSelectedIndex(index : number) {
  range.value = index.toString();
  updateGuiToMatchAvailable();
}

function getSelectedSegment() : Segment | undefined {
  const index = getSelectedIndex();
  const result = available[index];
  return result;
}

function updateGuiToMatchAvailable() {
  range.max = (available.length - 1).toString();
  const selectedIndex = getSelectedIndex();
  selectPrevious.disabled = selectedIndex < 1;
  selectNext.disabled = selectedIndex >= available.length - 1;
  context.beginPath();
  context.strokeStyle = "#080";
  context.lineWidth = 4.5;
  available.forEach((segment, index) => {
    if (index != selectedIndex) {
      canvasAdapter.addToPath(segment);
    }
  });
  context.stroke();
  context.beginPath();
  context.strokeStyle = "#AFA";
  const selectedSegment = getSelectedSegment();
  if (selectedSegment) {
    canvasAdapter.addToPath(selectedSegment);
  }
  context.stroke();
}

function add(type : "kite" | "dart") {
  const selectedSegment = getSelectedSegment();
  const newSegment = selectedSegment?selectedSegment.invert():Segment.create();
  const dart = type == "dart";
  const shape = Shape[dart?"createDart":"createKite"](newSegment);
  canvasAdapter.makeClosedPolygon(shape.points);
  context.fillStyle = dart?"#0FF":"#F0F";
  context.fill();
  context.strokeStyle = "black";
  context.lineWidth = 9.6;
  context.lineJoin = "round";
  context.stroke();
  addToAvailable(shape);
}

addKiteButton.addEventListener("click", () => {
  add("kite");
});

addDartButton.addEventListener("click", () => {
  add("dart");
});

// If you are dragging the mouse "input" will constantly call the listener as you keep moving.
// "change" will wait until you let go of the mouse before calling the listener.
// If you are using the keyboard, these two events are both called for each keystroke.
range.addEventListener("input", updateGuiToMatchAvailable);

selectPrevious.addEventListener("click", () => {
  setSelectedIndex(getSelectedIndex()-1);
});

selectNext.addEventListener("click", () => {
  setSelectedIndex(getSelectedIndex()+1);
});

updateGuiToMatchAvailable();