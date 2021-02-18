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
    this.checkForForce();
  }

  private checkForForce() {
    // See AllLegalVertices.jpg for a list of all legal moves.
    // There are exactly 7 legal ways that kites and darts can meet at a common vertex.
    // I've assigned letters to match the pictures to the comments.
    if (this.dot) {
      // This is A, B, or C in our picture.

      /**
       * Kites with the pointier side touching the common point.
       * I.e. kites with the longer segments touching the common point.
       */
      const kiteLong: Vertex[] = [];

      /**
       * Kites with the flatter side touching the common point.
       * I.e. kites with the shorter segments touching the common point.
       */
      const kiteShort: Vertex[] = [];

      /**
       * All darts touching the common point.
       */
      const dart: Vertex[] = [];

      this.vertices.forEach((vertex) => {
        if (vertex.type == "dart") {
          dart.push(vertex);
        } else {
          if (vertex.to.short) {
            kiteShort.push(vertex);
          } else {
            kiteLong.push(vertex);
          }
        }
      });

      if (kiteShort.length == 2) {
        // This must be case A.  We must have 2 darts.
        if (dart.length < 2) {
          const adjacent = kiteShort[0].isAdjacentTo(kiteShort[1]);
          if (!adjacent) {
            throw new Error("wtf");
          }
          const wantsDart = [adjacent.from.to, adjacent.to.from];
          wantsDart.forEach((segment) => (segment.forcedMove = "dart"));
          // This next part would be optional if we did all of the forced moves first.
          dart.forEach((dartVertex) => {
            const longSegment = dartVertex.from.long
              ? dartVertex.from
              : dartVertex.to;
            longSegment.forcedMove = "dart";
          });
        }
      } else if (kiteLong.length >= 3) {
        // This must be case C.  We must have 5 kites.
        if (kiteLong.length < 5) {
          kiteLong.forEach((vertex) => {
            vertex.to.forcedMove = "kite";
            vertex.from.forcedMove = "kite";
          });
        }
      } else if (kiteShort.length == 1) {
        // This must be case A or B.
        if (dart.length == 2 && kiteLong.length < 2) {
          const adjacent = dart.map((dartVertex) =>
            dartVertex.isAdjacentTo(kiteShort[0])
          );
          const wantsTwoLongKites = adjacent.every((result) => result);
          if (wantsTwoLongKites) {
            // This must be case B.
            dart.forEach((dartVertex) => {
              const longSegment = dartVertex.from.long
                ? dartVertex.from
                : dartVertex.to;
              longSegment.forcedMove = "kite";
            });
          }
          // TODO if there is example one kiteLong, then mark it
          // so the open side is another kite long.
        } else if (kiteLong.length > 0) {
          // We have at least one kite of each type so we know this
          // is case B.
          kiteShort[0].segments.forEach((segment) => {
            segment.forcedMove = "dart";
          });
          dart.forEach((dartVertex) => {
            dartVertex.segments.forEach((segment) => {
              segment.forcedMove = "kite";
            });
          });
          kiteLong.forEach((kiteVertex) => {
            // TODO use the kiteShort to figure out which
            // position we are in (bottom left or bottom right of
            // case B) then force both segments accordingly.
          });
        }
      }
      // TODO there is another way to get to case B.
      // If all three kites are there, you know it's case B,
      // so add some darts.
      // What if there were just two darts and they were not
      // adjacent?  That is also definitely B.  If you hit
      // "Do forced moves" you'll get to there eventually, but
      // we want to mark the long sides of the darts immediately.
    } else {
      // No dot.  This must match D, E, F, or G in the picture.

      /**
       * All kites meeting at this common point.
       */
      const kite: Vertex[] = [];

      /**
       * All darts pointing toward this common point.
       * Figures D, E, F, and G have 3, 0, 1, and 5 of these, respectively.
       */
      const dartIn: Vertex[] = [];

      /**
       * All darts pointing away from this common point.
       * Figures D, E, F, and G have 0, 1, 0, and 0 of these, respectively.
       */
      const dartOut: Vertex[] = [];

      this.vertices.forEach((vertex) => {
        if (vertex.type == "dart") {
          if (vertex.to.long) {
            dartIn.push(vertex);
          } else {
            dartOut.push(vertex);
          }
        } else {
          kite.push(vertex);
        }
      });

      if (dartOut.length == 1) {
        // Case E.
        // The dart is already annotated correctly by Shape.createDart().
        // It's tempting to move that code here for consistency.
        if (kite.length == 1) {
          // We need a second kite.
          kite[0].long.forcedMove = "kite";
        }
      } else if (dartIn.length == 4) {
        // This must be case G.  We must have 5 darts.
        this.vertices.forEach((vertex) => {
          vertex.to.forcedMove = "dart";
          vertex.from.forcedMove = "dart";
        });
      }
      // TODO:
      // If exactly 2 kites and exactly 2 darts, case D, add one more dart.
      // If exactly 2 kites and exactly 1 dart, and the dart is not adjacent to either kite, case D, add two more darts.
      // If 3 or 4 kites, case F, total 4 kites and 1 dart.
      // If exactly 2 kites and they are not adjacent, case F.
      //   If the dart is already in place, just fill in the two missing kites.
      //   Otherwise the dart will be touching at least on of the existing, but we have to figure out which of the four kite segments to start from.
      // If exactly 3 darts, and one is not adjacent to either of the other two, then case G.
      // Case E is definitely as good as it can be!
      // The others deserve a closer look.
      //   There can be strange cases,
      //   especially when the pieces are coming from two different directions.
    }
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

class LegalVertexGroup {
  /**
   * We sometimes want to use an angle as a key.
   * But round off error means we might not always get an identical error.
   * This function has a period of 2π.
   * The way this is normally used, we call the first angle 0°.
   * @param angle in radians.  Should be >= 0 and < 2π.
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

  private constructor(
    public readonly dot: boolean,
    public readonly shapes: ReadonlyMap<number, "kite" | "dart">,
    public readonly name: string
  ) {
  }
  intersection(that: LegalVertexGroup) {
    // assert(this.dot == that.dot)
    const shapes = new Map<number, "kite" | "dart">();
    this.shapes.forEach((type, degrees) => {
      if (that.shapes.get(degrees) === type) {
        shapes.set(degrees, type);
      }
    });
    return new LegalVertexGroup(this.dot, shapes, this.name + '∩' + that.name);
  }
  contains(that: LegalVertexGroup) {
    for (const entry of that.shapes) {
      if (this.shapes.get(entry[0]) != entry[1]) {
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
          const rotatedShapes = new Map<number, "kite" | "dart">();
          this.shapes.forEach((type, originalDegrees) => {
            const newDegrees = (originalDegrees - degreesToRotate + 360) % 360;
            rotatedShapes.set(newDegrees, type);
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
      const shapes = new Map<number, "kite" | "dart">();
      // Ideally we'd use a different pool of Point objects starting here.
      for (const type of moves) {
        shapes.set(this.makeKey(segment.angle), type);
        const shape = Shape.create(segment, type);
        segment = shape.segments.find(segment => segment.to == Point.ORIGIN)!.invert();
      }
      if (!segment.equals(firstSegment)) {
        throw new Error("wtf");
      }
      return new LegalVertexGroup(dot, shapes, name);
  }
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
 * - The angle of the incoming segment, in the normal/internal/radians format.  Cached to avoid recomputing.
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
