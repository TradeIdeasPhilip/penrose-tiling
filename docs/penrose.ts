import { getById } from "./library/typescript/client/client-misc.js";

const φ = (1 + Math.sqrt(5)) / 2;
const longLength = 100;
const shortLength = longLength / φ;

/**
 * This is a wrapper around a Canvas.  Mostly it is used to translate between
 * internal coordinates and Canvas coordinates.
 */
export class CanvasAdapter {
  public readonly canvas: HTMLCanvasElement;
  public readonly context: CanvasRenderingContext2D;
  private xOffset = 0;
  private yOffset = 0;
  private scale = 1;
  constructor(canvas: HTMLCanvasElement | string) {
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas;
    } else {
      this.canvas = getById(canvas, HTMLCanvasElement);
    }
    this.context = this.canvas.getContext("2d")!;
    this.recenter();
  }
  private recenter() {
    this.xOffset = this.canvas.width / 2;
    this.yOffset = this.canvas.height / 2;
  }

  /**
   * @param point The point in internal coordinates.
   * The origin is in the center.
   * Positive numbers move right and up.
   * Like in math class!
   * @returns The point in Canvas coordinates.
   * The origin is at the top left.
   * Positive numbers move right and down.
   */
  public intoCanvasSpace(point: Point) {
    return {
      x: point.x * this.scale + this.xOffset,
      y: this.yOffset - point.y * this.scale,
    };
  }

  /**
   * Add a new point to the end of the path.
   * Jump directly to this point without adding a line segment.
   * @param point The new point to add, in internal coordinates.
   */
  public moveTo(point: Point) {
    const { x, y } = this.intoCanvasSpace(point);
    this.context.moveTo(x, y);
  }

  /**
   * Add a new point to the end of the path.
   * Add a line segment from the previous last point to this one.
   * @param point The new point to add, in internal coordinates.
   */
  public lineTo(point: Point) {
    const { x, y } = this.intoCanvasSpace(point);
    this.context.lineTo(x, y);
  }

  /**
   * Add this to the end of the path.
   * This segment might not be touching any other parts of the path.
   * @param segment The new segment to add.
   */
  public addToPath(segment: Segment) {
    this.moveTo(segment.from);
    this.lineTo(segment.to);
  }

  /**
   * Create a new closed path.
   * @param points The vertices of the new polygon.
   */
  public makeClosedPolygon(points: readonly Point[]) {
    this.context.beginPath();
    points.forEach((point, index) => {
      if (index == 0) {
        this.moveTo(point);
      } else {
        this.lineTo(point);
      }
    });
    this.context.closePath();
  }

  /**
   * Add a circle to the current path.
   * Aimed at debugging.
   * @param point The center of the circle.
   * @param radius The radius of the circle.
   */
  addCircle(point : Point, radius : number) {
    const { x, y } = this.intoCanvasSpace(point);
    this.context.arc(x, y, radius, 0, 2*Math.PI);
  }

  /**
   * Draws a circle and fills it in.
   * The path of the circle is left in the canvas, in case you want to draw a border.
   * Aimed at debugging.
   * @param point The center of the circle.
   * @param radius The radius of the circle.
   * @param fillStyle Typically an HTML color, but anything that works for CanvasRenderingContext2D.fillStyle.
   */
  drawCircle(point : Point, radius : number, fillStyle : string | CanvasGradient | CanvasPattern) {
    const { x, y } = this.intoCanvasSpace(point);
    const context = this.context;
    context.beginPath()
    context.fillStyle = fillStyle;
    this.addCircle(point, radius);
    context.fill();
  }

  /**
   * Set the number of pixels in the bitmap backing the canvas to match the number of pixels shown on the screen.
   * That used to be the default.
   * Now web browsers are likely to lie about the number of pixels by default, so old web pages are easier to read on 4k monitors.
   * However, the image quality suffers.
   * This function restores the quality of your 4k monitor.
   */
  makeBitmapMatchElement() {
    const canvas = this.canvas;
    const style = canvas.style;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    this.recenter();
  }

  /**
   * Set the number of pixels shown on the screen to match the number of pixels in the bitmap backing the canvas.
   * That used to be the default.
   * Now web browsers are likely to lie about the number of pixels by default, so old web pages are easier to read on 4k monitors.
   * However, the image quality suffers.
   * This function restores the quality of your 4k monitor.
   */
  makeElementMatchBitmap() {
    const canvas = this.canvas;
    const style = canvas.style;
    style.width = canvas.width / devicePixelRatio + "px";
    style.height = canvas.height / devicePixelRatio + "px";
  }
}

export class Point {
  // TODO Use a more efficient data structure.
  private static readonly all: Point[] = [];

  private constructor(public readonly x: number, public readonly y: number) {}

  static find(x: number, y: number): Point {
    let found: Point | undefined;
    for (const point of Point.all) {
      const diff = Math.hypot(x - point.x, y - point.y);
      if (diff < 1) {
        found = point;
        //if (diff > 0) {
        //  console.log("Point.find", { x, y, point, diff });
        //}
        break;
      }
    }
    if (!found) {
      found = new Point(x, y);
      this.all.push(found);
    }
    return found;
  }

  static readonly ORIGIN = Point.find(0, 0);
}

/**
 * This class is a test of embedded images in VS Code.
 * IntelliSense will show images that start with https:// just fine.
 * IntelliSense will **not** show the image if it is a local file.
 * In the preview of a *.md file, VS code can handle local images just fine.
 */
class IntelliSenseTest {
  /**
   * `to` and `from` assume that we are moving around the shape counter-clockwise,
   * i.e. the mathematically positive direction.
   * ![explanation of dots](./kite-dart-dots.png)
   * @param from Go counter-clockwise to find `to`.
   * @param to Go clockwise to find `from`.
   * @param fromDot The dot is closest to `from`.
   * @param long This segment is longer than some but equal to others.
   */
  constructor(
    public readonly from: Point,
    public readonly to: Point,
    public readonly fromDot: boolean,
    public readonly long: boolean
  ) {}
}

export class Segment {
  /**
   * `to` and `from` assume that we are moving around the shape counter-clockwise,
   * i.e. the mathematically positive direction.
   * ![explanation of dots](https://raw.githubusercontent.com/TradeIdeasPhilip/penrose-tiling/master/docs/kite-dart-dots.png)
   * @param from Go counter-clockwise to find `to`.
   * @param to Go clockwise to find `from`.
   * @param fromDot The dot is closest to `from`.
   * @param long This segment is longer than some but equal to others.
   */
  constructor(
    public readonly from: Point,
    public readonly to: Point,
    public readonly fromDot: boolean,
    public readonly long: boolean
  ) {}

  complements(that: Segment) {
    return (
      this.from == that.to &&
      this.to == that.from &&
      this.fromDot == that.toDot &&
      this.long == that.long
    );
  }

  equals(that: Segment) {
    return this.from == that.from && this.to == that.to && this.fromDot == that.fromDot;
  }

  /**
   * The dot is closest to `to`.
   */
  get toDot(): boolean {
    return !this.fromDot;
  }

  /**
   * This segment is shorter than some but equal to others.
   */
  get short(): boolean {
    return !this.long;
  }

  /**
   * Create a matching Segment that would fit with this one.
   */
  invert(): Segment {
    // Swap "from" and "to".  Keep long/short as is.
    return new Segment(this.to, this.from, this.toDot, this.long);
  }

  /**
   * The angle of this segment.  We measure it like in math class:
   * 0 means the segment is going directly to the right.
   * Adding a small positive number to the angle means rotating a small amount counterclockwise.
   * We measure in radians, i.e. `2*Math.PI` is a complete circle.
   * 
   * If you want to compare two angles, consider using LegalVertexGroup.makeKey().
   * That takes care of round off error and other ambiguities.
   */
  get angle() {
    // Warning:  y for the canvas is positive down.  Everywhere else we've been
    // using the convention that y is positive up.
    return Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x);
  }

  static create(
    from: Point = Point.ORIGIN,
    fromDot?: boolean,
    long?: boolean,
    initialAngle?: number
  ) {
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

  private _forcedMove: "kite" | "dart" | undefined;

  get forcedMove() {
    return this._forcedMove;
  }

  set forcedMove(newValue) {
    if (newValue !== this._forcedMove) {
      if (this._forcedMove) {
        // If we tried to change the value, and the old value was not undefined, this is an illegal change.
        throw new Error("wtf");
      }
      this._forcedMove = newValue;
    }
  }
}

type ShapeInfo = (previous: {
  fromDot: boolean;
  long: boolean;
}) => { fromDot: boolean; long: boolean; angle: number };

/**
 * Convert from the format used on Wikipedia and what we need.
 * ![Wikipedia](https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Kite_Dart.svg/450px-Kite_Dart.svg.png)
 * @param degrees The size of the interior angle.
 * @returns The number of radians to add to the previous angle to get the next angle.
 */
function fromInteriorAngle(degrees: number) {
  return ((180 - degrees) / 180) * Math.PI;
}

/** Interior angle of 36° */
const a36 = fromInteriorAngle(36);

/** Interior angle of 72° */
const a72 = fromInteriorAngle(72);

/** Interior angle of 144° */
const a144 = fromInteriorAngle(144);

/** Interior angle of 216° */
const a216 = fromInteriorAngle(216);

export class Shape {
  public readonly segments: readonly Segment[];

  get points() {
    return this.segments.map((segment) => segment.from);
  }

  private constructor(
    firstSegment: Segment,
    shapeInfo: ShapeInfo,
    public readonly type: "kite" | "dart"
  ) {
    const segments = [firstSegment];
    while (segments.length < 4) {
      const previous = segments[segments.length - 1];
      const nextInfo = shapeInfo(previous);
      const next = Segment.create(
        previous.to,
        nextInfo.fromDot,
        nextInfo.long,
        previous.angle + nextInfo.angle
      );
      segments.push(next);
    }
    this.segments = segments;
  }

  private static kiteInfo(
    previous: Parameters<ShapeInfo>[0]
  ): ReturnType<ShapeInfo> {
    const fromDot = !previous.fromDot;
    const long = previous.fromDot ? !previous.long : previous.long;
    const angle = fromDot && !long ? a144 : a72;
    return { fromDot, long, angle };
  }

  static createKite(segment: Segment): Shape {
    return new this(segment, this.kiteInfo, "kite");
  }

  private static dartInfo(
    previous: Parameters<ShapeInfo>[0]
  ): ReturnType<ShapeInfo> {
    const fromDot = !previous.fromDot;
    const long = previous.fromDot ? previous.long : !previous.long;
    const angle = fromDot ? a36 : long ? a72 : a216;
    return { fromDot, long, angle };
  }

  static createDart(segment: Segment): Shape {
    const result = new this(segment, this.dartInfo, "dart");
    result.segments.forEach((segment) => {
      if (segment.short) {
        segment.forcedMove = "kite";
      }
    });
    return result;
  }

  static createComplementary(segment: Segment) {
    if (segment.forcedMove) {
      return this.create(segment, segment.forcedMove);
    } else {
      return;
    }
  }

  static create(segment: Segment, type: "kite" | "dart") {
    if (type == "kite") {
      return this.createKite(segment);
    } else if (type == "dart") {
      return this.createDart(segment);
    } else {
      console.log("create", { segment, type });
      throw new Error("wtf");
    }
  }
}

/**
 * A `Vertex` is a corner of a polygon.
 * This class helps us find all of the `Vertex`'s that meet at a given point.
 */
export class Vertex {
  /**
   *
   * @param to The segment leading *to* this `Vertex`.
   * @param from The segment leading away *from* this `Vertex`.
   * @param shape The `Vertex` is part of this shape.
   */
  constructor(
    public readonly to: Segment,
    public readonly from: Segment,
    public readonly shape: Shape
  ) {
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

  /**
   * This measures the angle between the segment going into this point and the segment leaving this point.
   * This would not change if you rotated the entire shape.
   * This is measured in degrees, as in LegalVertexGroup.makeKey(), so you can use == to compare two results.
   * This will be less than 180° for a convex angle, including all four corners of a kite and 3 corners of a dart.
   * This will return exactly the numbers you typically see for these angle, e.g. https://en.wikipedia.org/wiki/Penrose_tiling#/media/File:Kite_Dart.svg
   */
  get interiorAngle() {
    return LegalVertexGroup.makeKey(Math.PI - (this.to.angle - this.from.angle));
  }

  private getUnique(predicate: "long" | "short") {
    let count = 0;
    let result: Segment | undefined;
    this.segments.forEach((segment) => {
      if (segment[predicate]) {
        result = segment;
        count++;
      }
    });
    if (count == 1) {
      return result!;
    }
    throw new Error(count + " segments are " + predicate);
  }

  get long() {
    return this.getUnique("long");
  }

  get short() {
    return this.getUnique("short");
  }

  /**
   * See if two `Vertex`'s share an edge.
   * @param that The other vertex that we are comparing to `this` one.
   * @returns undefined if they do not share an edge.
   * If they do share end edge then this will return an object where to.to and from.from point to the common edge.
   */
  isAdjacentTo(that: Vertex): { to: Vertex; from: Vertex } | undefined {
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

/**
 * A `VertexGroup` is a group of vertices of 1 or more `Shape`'s meeting at a single point.
 */
export class VertexGroup {
  private readonly vertices: Vertex[] = [];

  private static readonly all = new Map<Point, VertexGroup>();

  static addShape(shape: Shape) {
    shape.segments.forEach((toPoint, index, array) => {
      const fromPoint = array[(index + 1) % array.length];
      this.addVertex(new Vertex(toPoint, fromPoint, shape));
    });
  }

  private static addVertex(vertex: Vertex) {
    let group = this.all.get(vertex.point);
    if (!group) {
      group = new this();
      this.all.set(vertex.point, group);
    }
    group.addVertex(vertex);
  }

  private addVertex(vertex: Vertex) {
    this.vertices.push(vertex);
    LegalVertexGroup.checkForForce(this.vertices);
  }

  /**
   * Use `addShape()` to create one of these.
   */
  private constructor() {}

  private get dot() {
    return this.vertices[0].dot;
  }

  private get point() {
    return this.vertices[0].point;
  }
}

/**
 * This is how we represent the allowed shapes inside LegalVertexGroup.
 * The interiorAngle is measured in degrees.
 * We start from a Vertex object, but we only care about the parts that don't change when we rotate or move the shape.
 */
type LegalVertexInfo = {readonly interiorAngle : number, type : "kite" | "dart"};
function lvi_equal(a : LegalVertexInfo | undefined, b : LegalVertexInfo | undefined) {
  if ((!a) && (!b)) {
    return true;
  } else if ((!a) || (!b)) {
    return false;
  } else {
    return (a.interiorAngle == b.interiorAngle) && (a.type == b.type);
  }
}

class LegalVertexGroup {

  /**
   * We sometimes want to use an angle as a key.
   * But round off error means we might not always get an identical value.
   *
   * This function has a period of 2π.
   * 
   * The way this is normally used, we call the first angle 0°.
   * If one angle is actually 1.49999° (initially expressed in radians) and a second
   * angle is 1.500001°, and you put both numbers into here, you'll get
   * 1° and 2° as the two results.  If you compare those two results using ==, the
   * result will be false, which is probably not what you wanted.  On the other
   * hand, if you subtract 1.49999° from both angles before the conversion, they
   * will both return 0°.
   * @param angle in radians.
   * @returns angle converted to degrees and rounded to an integer.
   * This will be >= 0° and < 360°
   */
  public static makeKey(angle : number) : number {
    let degrees = Math.round((angle * 180) / Math.PI) % 360;
    if (degrees < 0) {
      degrees += 360;
    }
    return degrees;
  }

  public static checkForForce(currentVertices : ReadonlyArray<Vertex>) {
    if (currentVertices.length <= 1) {
      // This is an optimization.  There is only one case where we know
      // about a force from a single shape.  That's case E from
      // AllLegalVertices.jpg.  That case gets covered in Shape.createDart(),
      // so we don't need to worry about it here.
      return;
    }
    const minAngle = Math.min(...currentVertices.map(vertex => vertex.from.angle));
    const inDegrees = new Map<number, Vertex>();
    currentVertices.forEach(vertex => inDegrees.set(LegalVertexGroup.makeKey(vertex.from.angle - minAngle), vertex));
    const legalVertexGroups = LegalVertexGroup.find(currentVertices[0].dot);
    const possibleGroups = legalVertexGroups.filter(group => group.contains(inDegrees));
    if (possibleGroups.length == 0) {
      throw new Error("We are already in an illegal position.");
    }
    const requirements = possibleGroups.reduce((g1, g2) => g1.intersection(g2));
    const center = currentVertices[0].from.from;
    const inputType = currentVertices[0].dot?"dot":"no dot";
    const input = Array.from(inDegrees.entries()).map(entry => [entry[0], entry[1].type]);
    console.log("checkForForce()", { center, inputType, input, requirements });
  }

  private constructor(
    public readonly dot: boolean,
    public readonly shapes: ReadonlyMap<number, LegalVertexInfo>,
    public readonly name: string
  ) {
  }
  intersection(that: LegalVertexGroup) {
    // assert(this.dot == that.dot)
    const shapes = new Map<number, LegalVertexInfo>();
    this.shapes.forEach((vertexInfo, degrees) => {
      if (lvi_equal(that.shapes.get(degrees), vertexInfo)) {
        shapes.set(degrees, vertexInfo);
      }
    });
    return new LegalVertexGroup(this.dot, shapes, this.name + '∩' + that.name);
  }
  contains(shapes: ReadonlyMap<number, Vertex>) {
    // Check each shape in the input against shapes in this LegalVertexInfo.
    for (const entry of shapes) {
      const fromThis = this.shapes.get(entry[0]);
      const fromShapes = entry[1];
      if (!lvi_equal(fromThis, fromShapes)) {
        // We could not find a corresponding piece,
        // or two pieces lined up but they are different pieces,
        // or the same piece in different orientations.
        return false;
      }
    }
    return true;
  }
  private allRotations() {
      let result: LegalVertexGroup[] = [];
      this.shapes.forEach((unused, degreesToRotate) => {
        if (degreesToRotate == 0) {
          result.push(this);
        } else {
          const rotatedShapes = new Map<number, LegalVertexInfo>();
          this.shapes.forEach((vertexInfo, originalDegrees) => {
            const newDegrees = (originalDegrees - degreesToRotate + 360) % 360;
            rotatedShapes.set(newDegrees, vertexInfo);
          });
          result.push(new LegalVertexGroup(this.dot, rotatedShapes, this.name));
        }
      });
      return result;
  }
  private static make(
    name: string,
    dot: boolean,
    moves: readonly ("kite" | "dart")[]
  ) {
      const firstSegment = Segment.create(Point.ORIGIN, dot, true, 0);
      let segment = firstSegment;
      const shapes = new Map<number, LegalVertexInfo>();
      // Ideally we'd use a different pool of Point objects starting here.
      for (const type of moves) {
        const shape = Shape.create(segment, type);
        const fromSegment = segment;
        const toSegment = shape.segments.find(segment => segment.to == Point.ORIGIN)!;
        const vertex = new Vertex(toSegment, fromSegment, shape);
        shapes.set(this.makeKey(segment.angle), vertex);
        segment = toSegment.invert();
      }
      if (!segment.equals(firstSegment)) {
        throw new Error("wtf");
      }
      return new LegalVertexGroup(dot, shapes, name);
  }
  // See AllLegalVertices.jpg for a list of all legal moves.
  // There are exactly 7 legal ways that kites and darts can meet at a common vertex.
  // I've assigned letters to match the pictures to the comments.
  private static readonly a = ["dart", "kite", "kite", "dart"] as readonly (
  | "kite"
  | "dart"
  )[];
  private static readonly b = [
    "kite",
    "dart",
    "kite",
    "dart",
    "kite",
  ] as readonly ("kite" | "dart")[];
  private static readonly c = [
    "kite",
    "kite",
    "kite",
    "kite",
    "kite",
  ] as readonly ("kite" | "dart")[];
  private static readonly d = [
    "dart",
    "dart",
    "dart",
    "kite",
    "kite",
  ] as readonly ("kite" | "dart")[];
  private static readonly e = ["kite", "dart", "kite"] as readonly (
    | "kite"
    | "dart"
  )[];
  private static readonly f = [
    "kite",
    "kite",
    "kite",
    "kite",
    "dart",
  ] as readonly ("kite" | "dart")[];
  private static readonly g = [
    "dart",
    "dart",
    "dart",
    "dart",
    "dart",
  ] as readonly ("kite" | "dart")[];

  static readonly dot = [
    ...LegalVertexGroup.make("A", true, LegalVertexGroup.a).allRotations(),
    ...LegalVertexGroup.make("B", true, LegalVertexGroup.b).allRotations(),
    LegalVertexGroup.make("C", true, LegalVertexGroup.c),
  ] as const;
  static readonly noDot = [
    ...LegalVertexGroup.make("D", false, LegalVertexGroup.d).allRotations(),
    ...LegalVertexGroup.make("E", false, LegalVertexGroup.e).allRotations(),
    ...LegalVertexGroup.make("F", false, LegalVertexGroup.f).allRotations(),
    LegalVertexGroup.make("G", false, LegalVertexGroup.g),
  ] as const;
  static find(dot: boolean) {
    return dot ? this.dot : this.noDot;
  }
}
/**
 * The answer:
 * makeKey() -- Converting from radians to degrees should not be automatic.
 * It is a public static member function.
 * we return the result in degrees, and we use degrees internally as an array key.
 * exporting makeKey() allows the caller to use this as a key in his own data structures, so he can parse our results.
 * this is required at the end.  We get a picture saying these are the shapes you are required to have in each position.
 * And we have a list of the shapes that we already have, we used that as an input to get the new picture.
 * How do we match them?  It easy because each output has a key.
 * Before we asked for the required picture, we had to format our input to that routine.
 * That included a call to makeKey().  So we saved a copy of the result of makeKey() and we used that as a key in a map
 * pointing back to the original shape.  We use that map to decode the picture.
 *
 * We are already storing all required rotations of the allowed types.  We don't need to rotate the input.
 * We are inspecting a recently changed vertex group.
 * We map() over the list of currently placed vertices.
 * We collect whatever data is required by the comparison tool.
 * - The angle of the segment coming from the vertex, in the normal/internal/radians format.  Cached to avoid recomputing.
 * - Space for the final angle to be filled in later.  i.e. the key.
 * - A pointer to the vertex.  -- so we don't need anything else.
 * We sort the array by angle.
 * We take the smallest angle (which is almost certainly negative) and make that the offset.
 * We want the first item in the list to be at angle 0, and rotate all the others accordingly.
 * Use the original angle, the offset, and get() to compute the keys we fill into the list.
 * Create a map from the key of each entry back to the entry itself.
 * We will use that map to decode the result.
 * Finally we need a new function to compare our input to all of the allowed patterns.
 * - should be simple!
 * - const possibleResults = available.filter(goodPattern => goodPattern.includes(inputList))
 * - no possible result means that we are already past the point of no return, typically throw an exception.
 * - take the intersection of all results, and those are the required moves, return that to the caller!
 * Bob's your uncle.
 */

// For the JavaScript console.
(window as any).Penrose = { Point, Segment, Shape, Vertex, VertexGroup, LegalVertexGroup };
