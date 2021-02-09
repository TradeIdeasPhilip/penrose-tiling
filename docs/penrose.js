import { getById } from "./library/typescript/client/client-misc.js";
var φ = (1 + Math.sqrt(5)) / 2;
var longLength = 60;
var shortLength = longLength / φ;
var CanvasAdapter = (function () {
    function CanvasAdapter(canvas) {
        this.xOffset = 0;
        this.yOffset = 0;
        this.scale = 1;
        if (canvas instanceof HTMLCanvasElement) {
            this.canvas = canvas;
        }
        else {
            this.canvas = getById(canvas, HTMLCanvasElement);
        }
        this.context = this.canvas.getContext("2d");
        this.recenter();
    }
    CanvasAdapter.prototype.recenter = function () {
        this.xOffset = this.canvas.width / 2;
        this.yOffset = this.canvas.height / 2;
    };
    CanvasAdapter.prototype.intoCanvasSpace = function (point) {
        return { x: point.x * this.scale + this.xOffset, y: this.yOffset - point.y * this.scale };
    };
    CanvasAdapter.prototype.moveTo = function (point) {
        var _a = this.intoCanvasSpace(point), x = _a.x, y = _a.y;
        this.context.moveTo(x, y);
    };
    CanvasAdapter.prototype.lineTo = function (point) {
        var _a = this.intoCanvasSpace(point), x = _a.x, y = _a.y;
        this.context.lineTo(x, y);
    };
    CanvasAdapter.prototype.makeClosedPolygon = function (points) {
        var _this = this;
        this.context.beginPath();
        points.forEach(function (point, index) {
            if (index == 0) {
                _this.moveTo(point);
            }
            else {
                _this.lineTo(point);
            }
        });
        this.context.closePath();
    };
    CanvasAdapter.prototype.setActualPixelSize = function () {
        var canvas = this.canvas;
        var style = canvas.style;
        style.width = (canvas.width / devicePixelRatio + "px");
        style.height = (canvas.height / devicePixelRatio + "px");
    };
    return CanvasAdapter;
}());
export { CanvasAdapter };
var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.find = function (x, y) {
        return new Point(x, y);
    };
    Point.ORIGIN = Point.find(0, 0);
    return Point;
}());
export { Point };
var Segment = (function () {
    function Segment(from, to, fromDot, long) {
        this.from = from;
        this.to = to;
        this.fromDot = fromDot;
        this.long = long;
    }
    Object.defineProperty(Segment.prototype, "toDot", {
        get: function () {
            return !this.fromDot;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Segment.prototype, "short", {
        get: function () {
            return !this.long;
        },
        enumerable: false,
        configurable: true
    });
    Segment.prototype.invert = function () {
        return new Segment(this.to, this.from, this.toDot, this.long);
    };
    Object.defineProperty(Segment.prototype, "angle", {
        get: function () {
            return Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x);
        },
        enumerable: false,
        configurable: true
    });
    Segment.create = function (from, fromDot, long, initialAngle) {
        if (from === void 0) { from = Point.ORIGIN; }
        if (fromDot === undefined) {
            fromDot = Math.random() < 0.5;
        }
        if (long === undefined) {
            long = Math.random() < 0.5;
        }
        if (initialAngle === undefined) {
            initialAngle = Math.random() * Math.PI * 2;
        }
        var length = long ? longLength : shortLength;
        var Δx = Math.cos(initialAngle) * length;
        var Δy = Math.sin(initialAngle) * length;
        var to = Point.find(from.x + Δx, from.y + Δy);
        return new this(from, to, fromDot, long);
    };
    return Segment;
}());
export { Segment };
function fromInteriorAngle(degrees) {
    return ((180 - degrees) / 180) * Math.PI;
}
var a36 = fromInteriorAngle(36);
var a72 = fromInteriorAngle(72);
var a144 = fromInteriorAngle(144);
var a216 = fromInteriorAngle(216);
var Shape = (function () {
    function Shape(firstSegment, shapeInfo) {
        var segments = [firstSegment];
        while (segments.length < 4) {
            var previous = segments[segments.length - 1];
            var nextInfo = shapeInfo(previous);
            var next = Segment.create(previous.to, nextInfo.fromDot, nextInfo.long, previous.angle + nextInfo.angle);
            segments.push(next);
        }
        this.segments = segments;
    }
    Object.defineProperty(Shape.prototype, "points", {
        get: function () {
            return this.segments.map(function (segment) { return segment.from; });
        },
        enumerable: false,
        configurable: true
    });
    Shape.kiteInfo = function (previous) {
        var fromDot = !previous.fromDot;
        var long = previous.fromDot ? !previous.long : previous.long;
        var angle = fromDot && !long ? a144 : a72;
        return { fromDot: fromDot, long: long, angle: angle };
    };
    Shape.createKite = function (segment) {
        return new this(segment, this.kiteInfo);
    };
    Shape.dartInfo = function (previous) {
        var fromDot = !previous.fromDot;
        var long = previous.fromDot ? previous.long : !previous.long;
        var angle = fromDot ? a36 : long ? a72 : a216;
        return { fromDot: fromDot, long: long, angle: angle };
    };
    Shape.createDart = function (segment) {
        return new this(segment, this.dartInfo);
    };
    return Shape;
}());
export { Shape };
window.Penrose = { Point: Point, Segment: Segment, Shape: Shape };
//# sourceMappingURL=penrose.js.map