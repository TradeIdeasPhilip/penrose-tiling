import { CanvasAdapter, Segment, Shape } from "./penrose.js";
import { getById } from "./library/typescript/client/client-misc.js";
var addKiteButton = getById("addKiteButton", HTMLButtonElement);
var addDartButton = getById("addDartButton", HTMLButtonElement);
var range = getById("range", HTMLInputElement);
var selectPrevious = getById("selectPrevious", HTMLButtonElement);
var selectNext = getById("selectNext", HTMLButtonElement);
var canvasAdapter = new CanvasAdapter("canvas");
canvasAdapter.makeBitmapMatchElement();
var context = canvasAdapter.context;
var available = [];
function addToAvailable(toAdd) {
    if (toAdd instanceof Segment) {
        toAdd = [toAdd];
    }
    else if (toAdd instanceof Shape) {
        toAdd = toAdd.segments;
    }
    for (var _i = 0, toAdd_1 = toAdd; _i < toAdd_1.length; _i++) {
        var segmentToAdd = toAdd_1[_i];
        var index = available.findIndex(segmentToAdd.complements, segmentToAdd);
        if (index < 0) {
            available.push(segmentToAdd);
        }
        else {
            available.splice(index, 1);
        }
    }
    updateGuiToMatchAvailable();
}
function getSelectedIndex() {
    return parseInt(range.value);
}
function setSelectedIndex(index) {
    range.value = index.toString();
    updateGuiToMatchAvailable();
}
function getSelectedSegment() {
    var index = getSelectedIndex();
    var result = available[index];
    return result;
}
function updateGuiToMatchAvailable() {
    range.max = (available.length - 1).toString();
    var selectedIndex = getSelectedIndex();
    selectPrevious.disabled = selectedIndex < 1;
    selectNext.disabled = selectedIndex >= available.length - 1;
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
    var selectedSegment = getSelectedSegment();
    if (selectedSegment) {
        canvasAdapter.addToPath(selectedSegment);
    }
    context.stroke();
}
function add(type) {
    var selectedSegment = getSelectedSegment();
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
    addToAvailable(shape);
}
addKiteButton.addEventListener("click", function () {
    add("kite");
});
addDartButton.addEventListener("click", function () {
    add("dart");
});
range.addEventListener("input", updateGuiToMatchAvailable);
selectPrevious.addEventListener("click", function () {
    setSelectedIndex(getSelectedIndex() - 1);
});
selectNext.addEventListener("click", function () {
    setSelectedIndex(getSelectedIndex() + 1);
});
updateGuiToMatchAvailable();
//# sourceMappingURL=index.js.map