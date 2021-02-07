const φ = (1 + Math.sqrt(5)) / 2;
const longLength = 17;
const shortLength = longLength / φ;

class Point {
  private constructor(public readonly x: number, public readonly y: number) {}

  static find(x: number, y: number) {
    // TODO reuse these!  Create a list of known items.  Deal with round off error to find
    // identical items.  Only create a new item if we can't find an existing one that is
    // close enough.
    return new Point(x, y);
  }
}

class Segment {
  /**
   * `to` and `from` assume that we are moving around the shape counter-clockwise,
   * i.e. the mathematically positive direction.
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
  ) {
    console.log(from, to);
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

  get key() {
    if (this.fromDot) {
      return this.long ? "fromDotLong" : "fromDotShort";
    } else {
      return this.long ? "toDotLong" : "toDotShort";
    }
  }
}

type Segments = {
  fromDotLong: Segment & { fromDot: true; long: true };
  toDotLong: Segment & { fromDot: false; long: true };
  fromDotShort: Segment & { fromDot: true; long: false };
  toDotShort: Segment & { fromDot: true; long: false };
};

type ShapeInfo = Record<
  keyof Segments,
  { next: keyof Segments; nextAngle: number }
>;

export class Shape {
  public readonly segments: Segments;

  private constructor(firstSegment: Segment, shapeInfo : ShapeInfo) {
    const segments = {} as Segments;
    const initialKey = firstSegment.key;
    //segments[initialKey] = firstSegment;
    this.segments = segments;
  }

  private static readonly kiteInfo: ShapeInfo = {
    // TODO fill in the actual angles!
    fromDotShort: { next: "toDotLong", nextAngle: 0 },
    toDotLong: { next: "fromDotLong", nextAngle: 0 },
    fromDotLong: { next: "toDotShort", nextAngle: 0 },
    toDotShort: { next: "fromDotShort", nextAngle: 0 },
  };

  static createKite(segment: Segment): Shape {
    return new this(segment, this.kiteInfo);
  }

  private static readonly dartInfo: ShapeInfo = {
    // TODO fill in the actual angles!
    fromDotShort: { next: "toDotShort", nextAngle: 0 },
    toDotShort: { next: "fromDotLong", nextAngle: 0 },
    fromDotLong: { next: "toDotLong", nextAngle: 0 },
    toDotLong: { next: "fromDotShort", nextAngle: 0 },
  };

  static createDart(segment: Segment): Shape {
    return new this(segment, this.dartInfo);
  }

}
