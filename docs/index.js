import { CanvasAdapter, Segment, Shape } from "./penrose.js";
import { getById } from "./library/typescript/client/client-misc.js";
var addKiteButton = getById("addKiteButton", HTMLButtonElement);
var addDartButton = getById("addDartButton", HTMLButtonElement);
var range = getById("range", HTMLInputElement);
var canvasAdapter = new CanvasAdapter("canvas");
canvasAdapter.setActualPixelSize();
var context = canvasAdapter.context;
var available = [];
function add(type) {
    var dart = type == "dart";
    var shape = Shape[dart ? "createDart" : "createKite"](Segment.create());
    canvasAdapter.makeClosedPolygon(shape.points);
    context.fillStyle = dart ? "#0FF" : "#F0F";
    context.fill();
    context.strokeStyle = "black";
    context.lineWidth = 3;
    context.stroke();
    available.push.apply(available, shape.segments);
}
addKiteButton.addEventListener("click", function () {
    add("kite");
});
addDartButton.addEventListener("click", function () {
    add("dart");
});
//# sourceMappingURL=index.js.map