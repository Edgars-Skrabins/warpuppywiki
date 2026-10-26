export type Vec2 = readonly [number, number];

export type Vec3 = readonly [number, number, number];

export interface Box {
  min: Vec3;
  max: Vec3;
}

export interface MapMeta {
  bounds: { min: Vec2; max: Vec2 };
  image: { metersPerPixel: number };
}

export type HeightFn = (x: number, y: number) => number | null;
