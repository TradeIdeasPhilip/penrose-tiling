import {getById} from "./library/typescript/client/client-misc.js";

const φ = (1 + Math.sqrt(5)) / 2;
const longLength = 60;
const shortLength = longLength / φ;

export class CanvasAdapter {
  public readonly canvas : HTMLCanvasElement;
  public readonly context : CanvasRenderingContext2D;
  private xOffset = 0;
  private yOffset = 0;
  private scale = 1;
  constructor(canvas : HTMLCanvasElement | string) {
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
  public intoCanvasSpace(point : Point) {
    return { x : point.x * this.scale + this.xOffset, y : this.yOffset - point.y * this.scale };
  }
  public moveTo(point : Point) {
    const { x, y } = this.intoCanvasSpace(point);
    this.context.moveTo(x, y);
  }
  public lineTo(point : Point) {
    const { x, y } = this.intoCanvasSpace(point);
    this.context.lineTo(x, y);
  }
  public makeClosedPolygon(points : readonly Point[]) {
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
  setActualPixelSize() {
    const canvas = this.canvas;
    const style = canvas.style;
    style.width = (canvas.width / devicePixelRatio + "px");
    style.height = (canvas.height / devicePixelRatio + "px");
  }
}

export class Point {
  private constructor(public readonly x: number, public readonly y: number) {}

  static find(x: number, y: number) {
    // TODO reuse these!  Create a list of known items.  Deal with round off error to find
    // identical items.  Only create a new item if we can't find an existing one that is
    // close enough.
    return new Point(x, y);
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
    return this.segments.map(segment => segment.from);
  }

  private constructor(firstSegment: Segment, shapeInfo: ShapeInfo) {
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
    return new this(segment, this.kiteInfo);
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
    return new this(segment, this.dartInfo);
  }
}

// For the JavaScript console.
(window as any).Penrose = { Point, Segment, Shape };
