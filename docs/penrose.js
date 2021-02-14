import { getById } from "./library/typescript/client/client-misc.js";
const φ = (1 + Math.sqrt(5)) / 2;
const longLength = 90;
const shortLength = longLength / φ;
export class CanvasAdapter {
    constructor(canvas) {
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
    recenter() {
        this.xOffset = this.canvas.width / 2;
        this.yOffset = this.canvas.height / 2;
    }
    intoCanvasSpace(point) {
        return { x: point.x * this.scale + this.xOffset, y: this.yOffset - point.y * this.scale };
    }
    moveTo(point) {
        const { x, y } = this.intoCanvasSpace(point);
        this.context.moveTo(x, y);
    }
    lineTo(point) {
        const { x, y } = this.intoCanvasSpace(point);
        this.context.lineTo(x, y);
    }
    addToPath(segment) {
        this.moveTo(segment.from);
        this.lineTo(segment.to);
    }
    makeClosedPolygon(points) {
        this.context.beginPath();
        points.forEach((point, index) => {
            if (index == 0) {
                this.moveTo(point);
            }
            else {
                this.lineTo(point);
            }
        });
        this.context.closePath();
    }
    makeBitmapMatchElement() {
        const canvas = this.canvas;
        const style = canvas.style;
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        canvas.width = width * devicePixelRatio;
        canvas.height = height * devicePixelRatio;
        this.recenter();
    }
    makeElementMatchBitmap() {
        const canvas = this.canvas;
        const style = canvas.style;
        style.width = (canvas.width / devicePixelRatio + "px");
        style.height = (canvas.height / devicePixelRatio + "px");
    }
}
export class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static find(x, y) {
        let found;
        for (const point of Point.all) {
            const diff = Math.hypot(x - point.x, y - point.y);
            if (diff < 1) {
                found = point;
                if (diff > 0) {
                    console.log("Point.find", { x, y, point, diff });
                }
                break;
            }
        }
        if (!found) {
            found = new Point(x, y);
            this.all.push(found);
        }
        return found;
    }
}
Point.all = [];
Point.ORIGIN = Point.find(0, 0);
class IntelliSenseTest {
    constructor(from, to, fromDot, long) {
        this.from = from;
        this.to = to;
        this.fromDot = fromDot;
        this.long = long;
    }
}
export class Segment {
    constructor(from, to, fromDot, long) {
        this.from = from;
        this.to = to;
        this.fromDot = fromDot;
        this.long = long;
    }
    complements(that) {
        return (this.from == that.to) && (this.to == that.from) && (this.fromDot == that.toDot) && (this.long == that.long);
    }
    get toDot() {
        return !this.fromDot;
    }
    get short() {
        return !this.long;
    }
    invert() {
        return new Segment(this.to, this.from, this.toDot, this.long);
    }
    get angle() {
        return Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x);
    }
    static create(from = Point.ORIGIN, fromDot, long, initialAngle) {
        if (fromDot === undefined) {
            fromDot = Math.random() < 0.5;
        }
        if (long === undefined) {
            long = Math.random() < 0.5;
        }
        if (initialAngle === undefined) {
            initialAngle = Math.random() * Math.PI * 2;
        }
        const length = long ? longLength : shortLength;
        const Δx = Math.cos(initialAngle) * length;
        const Δy = Math.sin(initialAngle) * length;
        const to = Point.find(from.x + Δx, from.y + Δy);
        return new this(from, to, fromDot, long);
    }
    get forcedMove() {
        return this._forcedMove;
    }
    set forcedMove(newValue) {
        if (newValue !== this._forcedMove) {
            if (this._forcedMove) {
                throw new Error("wtf");
            }
            this._forcedMove = newValue;
        }
    }
}
function fromInteriorAngle(degrees) {
    return ((180 - degrees) / 180) * Math.PI;
}
const a36 = fromInteriorAngle(36);
const a72 = fromInteriorAngle(72);
const a144 = fromInteriorAngle(144);
const a216 = fromInteriorAngle(216);
export class Shape {
    constructor(firstSegment, shapeInfo, type) {
        this.type = type;
        const segments = [firstSegment];
        while (segments.length < 4) {
            const previous = segments[segments.length - 1];
            const nextInfo = shapeInfo(previous);
            const next = Segment.create(previous.to, nextInfo.fromDot, nextInfo.long, previous.angle + nextInfo.angle);
            segments.push(next);
        }
        this.segments = segments;
    }
    get points() {
        return this.segments.map(segment => segment.from);
    }
    static kiteInfo(previous) {
        const fromDot = !previous.fromDot;
        const long = previous.fromDot ? !previous.long : previous.long;
        const angle = fromDot && !long ? a144 : a72;
        return { fromDot, long, angle };
    }
    static createKite(segment) {
        return new this(segment, this.kiteInfo, "kite");
    }
    static dartInfo(previous) {
        const fromDot = !previous.fromDot;
        const long = previous.fromDot ? previous.long : !previous.long;
        const angle = fromDot ? a36 : long ? a72 : a216;
        return { fromDot, long, angle };
    }
    static createDart(segment) {
        const result = new this(segment, this.dartInfo, "dart");
        result.segments.forEach(segment => {
            if (segment.short) {
                segment.forcedMove = "kite";
            }
        });
        return result;
    }
    static createComplementary(segment) {
        if (segment.forcedMove) {
            return this.create(segment, segment.forcedMove);
        }
        else {
            return;
        }
    }
    static create(segment, type) {
        if (type == "kite") {
            return this.createKite(segment);
        }
        else if (type == "dart") {
            return this.createDart(segment);
        }
        else {
            console.log("create", { segment, type });
            throw new Error("wtf");
        }
    }
}
export class Vertex {
    constructor(to, from, shape) {
        this.to = to;
        this.from = from;
        this.shape = shape;
        if (to.to != from.from) {
            throw new Error("wtf");
        }
    }
    get point() {
        return this.to.to;
    }
    get dot() {
        return this.to.toDot;
    }
    get type() {
        return this.shape.type;
    }
    isAdjacentTo(that) {
        if (this.point != that.point) {
            throw new Error("wtf");
        }
        if (this.to.complements(that.from)) {
            return { to: this, from: that };
        }
        if (this.from.complements(that.to)) {
            return { to: that, from: this };
        }
        return;
    }
}
export class VertexGroup {
    constructor() {
        this.vertices = [];
    }
    static addShape(shape) {
        shape.segments.forEach((toPoint, index, array) => {
            const fromPoint = array[(index + 1) % array.length];
            this.addVertex(new Vertex(toPoint, fromPoint, shape));
        });
    }
    static addVertex(vertex) {
        let group = this.all.get(vertex.point);
        if (!group) {
            group = new this();
            this.all.set(vertex.point, group);
        }
        group.addVertex(vertex);
    }
    addVertex(vertex) {
        this.vertices.push(vertex);
        this.checkForForce();
    }
    checkForForce() {
        if (this.dot) {
            const kiteLong = [];
            const kiteShort = [];
            const dart = [];
            this.vertices.forEach(vertex => {
                if (vertex.type == "dart") {
                    dart.push(vertex);
                }
                else {
                    if (vertex.to.short) {
                        kiteShort.push(vertex);
                    }
                    else {
                        kiteLong.push(vertex);
                    }
                }
            });
            if (kiteShort.length == 2) {
                if (dart.length < 2) {
                    const adjacent = kiteShort[0].isAdjacentTo(kiteShort[1]);
                    if (!adjacent) {
                        throw new Error("wtf");
                    }
                    const wantsDart = [adjacent.from.to, adjacent.to.from];
                    wantsDart.forEach(segment => segment.forcedMove = "dart");
                }
            }
        }
        else {
        }
    }
    get dot() {
        return this.vertices[0].dot;
    }
    get point() {
        return this.vertices[0].point;
    }
}
VertexGroup.all = new Map();
window.Penrose = { Point, Segment, Shape, Vertex, VertexGroup };
//# sourceMappingURL=penrose.js.map