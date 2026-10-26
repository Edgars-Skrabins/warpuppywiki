import type { MapMeta, Vec2 } from "./types";

export function worldToPixel(map: MapMeta, x: number, y: number): Vec2 {
  const { min } = map.bounds;
  const { metersPerPixel } = map.image;
  return [(x - min[0]) / metersPerPixel, (y - min[1]) / metersPerPixel];
}

export function pixelToWorld(map: MapMeta, px: number, py: number): Vec2 {
  const { min } = map.bounds;
  const { metersPerPixel } = map.image;
  return [min[0] + px * metersPerPixel, min[1] + py * metersPerPixel];
}

export function isInBounds(map: MapMeta, x: number, y: number): boolean {
  const { min, max } = map.bounds;
  return x >= min[0] && x <= max[0] && y >= min[1] && y <= max[1];
}

export function clampToBounds(map: MapMeta, x: number, y: number): Vec2 {
  const { min, max } = map.bounds;
  return [Math.min(Math.max(x, min[0]), max[0]), Math.min(Math.max(y, min[1]), max[1])];
}
