import {CanvasAdapter, Point, Segment, Shape} from "./penrose.js";

import {getById} from "./library/typescript/client/client-misc.js";

const addKiteButton = getById("addKiteButton", HTMLButtonElement);
const addDartButton = getById("addDartButton", HTMLButtonElement);
const range = getById("range", HTMLInputElement);

const canvasAdapter = new CanvasAdapter("canvas");
canvasAdapter.setActualPixelSize();
const context = canvasAdapter.context;

const available : Segment[] = [];

function getSelectedIndex() : number {
  return parseInt(range.value);
}

function takeSelectedSegment() : Segment | undefined {
  const index = getSelectedIndex();
  const result = available[index];
  if (result) {
    available.splice(index, 1);
  }
  return result;
}

function updateGuiToMatchAvailable() {
  range.max = (available.length - 1).toString();
  const selectedIndex = getSelectedIndex();
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
  canvasAdapter.addToPath(available[selectedIndex]);
  context.stroke();
}

function add(type : "kite" | "dart") {
  const selectedSegment = takeSelectedSegment();
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
  // The first time we just add all four segments.
  // Later we have to remove used ones, TODO.
  available.push(...shape.segments);
  updateGuiToMatchAvailable();
}

addKiteButton.addEventListener("click", () => {
  add("kite");
});

addDartButton.addEventListener("click", () => {
  add("dart");
});

range.addEventListener("change", updateGuiToMatchAvailable);