import {CanvasAdapter, Point, Segment, Shape} from "./penrose.js";

import {getById} from "./library/typescript/client/client-misc.js";

const addKiteButton = getById("addKiteButton", HTMLButtonElement);
const addDartButton = getById("addDartButton", HTMLButtonElement);
const range = getById("range", HTMLInputElement);

const canvasAdapter = new CanvasAdapter("canvas");
canvasAdapter.setActualPixelSize();
const context = canvasAdapter.context;

const available : Segment[] = [];

function add(type : "kite" | "dart") {
  const dart = type == "dart";
  const shape = Shape[dart?"createDart":"createKite"](Segment.create());
  canvasAdapter.makeClosedPolygon(shape.points);
  context.fillStyle = dart?"#0FF":"#F0F";
  context.fill();
  context.strokeStyle = "black";
  context.lineWidth = 3;
  context.stroke();
  // The first time we just add all four segments.  
  // Later we have to remove used ones, TODO.
  available.push(...shape.segments);
}

addKiteButton.addEventListener("click", () => {
  add("kite");
});

addDartButton.addEventListener("click", () => {
  add("dart");
});

