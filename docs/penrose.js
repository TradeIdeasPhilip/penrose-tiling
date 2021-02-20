import { getById } from "./library/typescript/client/client-misc.js";
const φ = (1 + Math.sqrt(5)) / 2;
const longLength = 100;
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
        return {
            x: point.x * this.scale + this.xOffset,
            y: this.yOffset - point.y * this.scale,
        };
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
    addCircle(point, radius) {
        const { x, y } = this.intoCanvasSpace(point);
        this.context.arc(x, y, radius, 0, 2 * Math.PI);
    }
    drawCircle(point, radius, fillStyle) {
        const { x, y } = this.intoCanvasSpace(point);
        const context = this.context;
        context.beginPath();
        context.fillStyle = fillStyle;
        this.addCircle(point, radius);
        context.fill();
    }
    drawSegments(segments, color = "orange", width = 12) {
        if (segments instanceof Segment) {
            segments = [segments];
        }
        const context = this.context;
        context.strokeStyle = color;
        context.lineWidth = width;
        context.lineCap = "round";
        context.beginPath();
        for (const segment of segments) {
            this.addToPath(segment);
        }
        context.stroke();
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
        style.width = canvas.width / devicePixelRatio + "px";
        style.height = canvas.height / devicePixelRatio + "px";
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
        return (this.from == that.to &&
            this.to == that.from &&
            this.fromDot == that.toDot &&
            this.long == that.long);
    }
    equals(that) {
        return this.from == that.from && this.to == that.to && this.fromDot == that.fromDot;
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
        return this.segments.map((segment) => segment.from);
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
        result.segments.forEach((segment) => {
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
    get segments() {
        return [this.to, this.from];
    }
    get interiorAngle() {
        return LegalVertexGroup.makeKey(Math.PI - (this.from.angle - this.to.angle));
    }
    get fromLong() {
        return this.from.long;
    }
    getUnique(predicate) {
        let count = 0;
        let result;
        this.segments.forEach((segment) => {
            if (segment[predicate]) {
                result = segment;
                count++;
            }
        });
        if (count == 1) {
            return result;
        }
        throw new Error(count + " segments are " + predicate);
    }
    get long() {
        return this.getUnique("long");
    }
    get short() {
        return this.getUnique("short");
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
        LegalVertexGroup.checkForForce(this.vertices);
    }
    get dot() {
        return this.vertices[0].dot;
    }
    get point() {
        return this.vertices[0].point;
    }
}
VertexGroup.all = new Map();
function lvi_equal(a, b) {
    if ((!a) && (!b)) {
        return true;
    }
    else if ((!a) || (!b)) {
        return false;
    }
    else {
        return (a.interiorAngle == b.interiorAngle) && (a.type == b.type) && (a.fromLong == b.fromLong);
    }
}
class LegalVertexGroup {
    constructor(dot, shapes, name) {
        this.dot = dot;
        this.shapes = shapes;
        this.name = name;
    }
    static makeKey(angle) {
        let degrees = Math.round((angle * 180) / Math.PI) % 360;
        if (degrees < 0) {
            degrees += 360;
        }
        return degrees;
    }
    static checkForForce(currentVertices) {
        if (currentVertices.length <= 1) {
            return;
        }
        const minAngle = Math.min(...currentVertices.map(vertex => vertex.from.angle));
        const inDegrees = new Map();
        currentVertices.forEach(vertex => inDegrees.set(LegalVertexGroup.makeKey(vertex.from.angle - minAngle), vertex));
        const legalVertexGroups = LegalVertexGroup.find(currentVertices[0].dot);
        const possibleGroups = legalVertexGroups.filter(group => group.contains(inDegrees));
        if (possibleGroups.length == 0) {
            throw new Error("We are already in an illegal position.");
        }
        const requirements = possibleGroups.reduce((g1, g2) => g1.intersection(g2));
        requirements.shapes.forEach((legalVertexInfo, degrees) => {
            if (!inDegrees.has(degrees)) {
                const nextShapeDegrees = (degrees + legalVertexInfo.interiorAngle) % 360;
                const nextShape = inDegrees.get(nextShapeDegrees);
                if (nextShape) {
                    nextShape.from.forcedMove = legalVertexInfo.type;
                }
                for (const fromCurrent of inDegrees) {
                    const currentAngle = fromCurrent[0];
                    const currentVertex = fromCurrent[1];
                    const nextAngle = currentAngle + currentVertex.interiorAngle;
                    if (nextAngle == degrees) {
                        currentVertex.to.forcedMove = legalVertexInfo.type;
                        break;
                    }
                }
            }
        });
        const center = currentVertices[0].from.from;
        const inputType = currentVertices[0].dot ? "dot" : "no dot";
        const input = Array.from(inDegrees.entries()).map(entry => [entry[0], entry[1].type]);
    }
    intersection(that) {
        const shapes = new Map();
        this.shapes.forEach((vertexInfo, degrees) => {
            if (lvi_equal(that.shapes.get(degrees), vertexInfo)) {
                shapes.set(degrees, vertexInfo);
            }
        });
        return new LegalVertexGroup(this.dot, shapes, this.name + '∩' + that.name);
    }
    contains(shapes) {
        for (const entry of shapes) {
            const fromThis = this.shapes.get(entry[0]);
            const fromShapes = entry[1];
            if (!lvi_equal(fromThis, fromShapes)) {
                return false;
            }
        }
        return true;
    }
    allRotations() {
        let result = [];
        this.shapes.forEach((unused, degreesToRotate) => {
            if (degreesToRotate == 0) {
                result.push(this);
            }
            else {
                const rotatedShapes = new Map();
                this.shapes.forEach((vertexInfo, originalDegrees) => {
                    const newDegrees = (originalDegrees - degreesToRotate + 360) % 360;
                    rotatedShapes.set(newDegrees, vertexInfo);
                });
                result.push(new LegalVertexGroup(this.dot, rotatedShapes, this.name));
            }
        });
        return result;
    }
    static make(name, dot, moves) {
        const firstSegment = Segment.create(Point.ORIGIN, dot, true, 0);
        let segment = firstSegment;
        const shapes = new Map();
        for (const type of moves) {
            const shape = Shape.create(segment, type);
            const fromSegment = segment;
            const toSegment = shape.segments.find(segment => segment.to == Point.ORIGIN);
            const vertex = new Vertex(toSegment, fromSegment, shape);
            shapes.set(this.makeKey(segment.angle), vertex);
            segment = toSegment.invert();
        }
        if (!segment.equals(firstSegment)) {
            throw new Error("wtf");
        }
        return new LegalVertexGroup(dot, shapes, name);
    }
    static find(dot) {
        return dot ? this.dot : this.noDot;
    }
}
LegalVertexGroup.a = ["dart", "kite", "kite", "dart"];
LegalVertexGroup.b = [
    "kite",
    "dart",
    "kite",
    "dart",
    "kite",
];
LegalVertexGroup.c = [
    "kite",
    "kite",
    "kite",
    "kite",
    "kite",
];
LegalVertexGroup.d = [
    "dart",
    "dart",
    "dart",
    "kite",
    "kite",
];
LegalVertexGroup.e = ["kite", "dart", "kite"];
LegalVertexGroup.f = [
    "kite",
    "kite",
    "kite",
    "kite",
    "dart",
];
LegalVertexGroup.g = [
    "dart",
    "dart",
    "dart",
    "dart",
    "dart",
];
LegalVertexGroup.dot = [
    ...LegalVertexGroup.make("A", true, LegalVertexGroup.a).allRotations(),
    ...LegalVertexGroup.make("B", true, LegalVertexGroup.b).allRotations(),
    LegalVertexGroup.make("C", true, LegalVertexGroup.c),
];
LegalVertexGroup.noDot = [
    ...LegalVertexGroup.make("D", false, LegalVertexGroup.d).allRotations(),
    ...LegalVertexGroup.make("E", false, LegalVertexGroup.e).allRotations(),
    ...LegalVertexGroup.make("F", false, LegalVertexGroup.f).allRotations(),
    LegalVertexGroup.make("G", false, LegalVertexGroup.g),
];
window.Penrose = { Point, Segment, Shape, Vertex, VertexGroup, LegalVertexGroup };
//# sourceMappingURL=penrose.js.map