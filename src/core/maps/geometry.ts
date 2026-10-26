import type { Vec2, Vec3 } from "./types";

export function distance2d(a: Vec2 | Vec3, b: Vec2 | Vec3): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

export function distance3d(a: Vec3, b: Vec3): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
}

export function bearingDegrees(from: Vec2 | Vec3, to: Vec2 | Vec3): number {
  const degrees = (Math.atan2(to[0] - from[0], from[1] - to[1]) * 180) / Math.PI;
  return (degrees + 360) % 360;
}

export function lerpPoint(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
