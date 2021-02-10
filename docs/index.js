import { CanvasAdapter, Segment, Shape } from "./penrose.js";
import { getById } from "./library/typescript/client/client-misc.js";
var addKiteButton = getById("addKiteButton", HTMLButtonElement);
var addDartButton = getById("addDartButton", HTMLButtonElement);
var range = getById("range", HTMLInputElement);
var canvasAdapter = new CanvasAdapter("canvas");
canvasAdapter.setActualPixelSize();
var context = canvasAdapter.context;
var available = [];
function getSelectedIndex() {
    return parseInt(range.value);
}
function takeSelectedSegment() {
    var index = getSelectedIndex();
    var result = available[index];
    if (result) {
        available.splice(index, 1);
    }
    return result;
}
function updateGuiToMatchAvailable() {
    range.max = (available.length - 1).toString();
    var selectedIndex = getSelectedIndex();
    context.beginPath();
    context.strokeStyle = "#080";
    context.lineWidth = 4.5;
    available.forEach(function (segment, index) {
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
function add(type) {
    var selectedSegment = takeSelectedSegment();
    var newSegment = selectedSegment ? selectedSegment.invert() : Segment.create();
    var dart = type == "dart";
    var shape = Shape[dart ? "createDart" : "createKite"](newSegment);
    canvasAdapter.makeClosedPolygon(shape.points);
    context.fillStyle = dart ? "#0FF" : "#F0F";
    context.fill();
    context.strokeStyle = "black";
    context.lineWidth = 9.6;
    context.lineJoin = "round";
    context.stroke();
    available.push.apply(available, shape.segments);
    updateGuiToMatchAvailable();
}
addKiteButton.addEventListener("click", function () {
    add("kite");
});
addDartButton.addEventListener("click", function () {
    add("dart");
});
range.addEventListener("change", updateGuiToMatchAvailable);
//# sourceMappingURL=index.js.map