import { distance3d, lerpPoint } from "./geometry";
import type { Box, HeightFn, Vec3 } from "./types";

export interface Obstruction {
  kind: "terrain" | "building";
  point: Vec3;
  distance: number;
  buildingId?: string;
}

export interface PathOptions {
  terrain?: HeightFn;
  buildings?: readonly (Box & { id?: string })[];
  step?: number;
  clearance?: number;
  endpointMargin?: number;
}

export function segmentBoxEntry(from: Vec3, to: Vec3, box: Box): number | null {
  let tMin = 0;
  let tMax = 1;
  for (let axis = 0; axis < 3; axis++) {
    const start = from[axis]!;
    const delta = to[axis]! - start;
    const lo = box.min[axis]!;
    const hi = box.max[axis]!;
    if (Math.abs(delta) < 1e-12) {
      if (start < lo || start > hi) return null;
      continue;
    }
    let t1 = (lo - start) / delta;
    let t2 = (hi - start) / delta;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return null;
  }
  return tMin;
}

export function firstObstruction(path: readonly Vec3[], options: PathOptions = {}): Obstruction | null {
  const { terrain, buildings = [], step = 2, clearance = 0, endpointMargin = 2 } = options;
  if (path.length < 2) return null;
  if (step <= 0) throw new Error("step must be positive");

  const lengths = path.slice(1).map((p, i) => distance3d(path[i]!, p));
  const total = lengths.reduce((a, b) => a + b, 0);
  let best: Obstruction | null = null;
  const consider = (candidate: Obstruction) => {
    if (candidate.distance < endpointMargin || candidate.distance > total - endpointMargin) return;
    if (!best || candidate.distance < best.distance) best = candidate;
  };

  let offset = 0;
  for (let i = 0; i < lengths.length; i++) {
    const a = path[i]!;
    const b = path[i + 1]!;
    const length = lengths[i]!;
    if (length === 0) continue;

    const minX = Math.min(a[0], b[0]);
    const maxX = Math.max(a[0], b[0]);
    const minY = Math.min(a[1], b[1]);
    const maxY = Math.max(a[1], b[1]);
    for (const box of buildings) {
      if (box.max[0] < minX || box.min[0] > maxX || box.max[1] < minY || box.min[1] > maxY) continue;
      const t = segmentBoxEntry(a, b, box);
      if (t !== null) {
        const d = offset + t * length;
        if (d >= endpointMargin || t > 0) {
          consider({
            kind: "building",
            point: lerpPoint(a, b, t),
            distance: d,
            ...(box.id ? { buildingId: box.id } : {}),
          });
        }
      }
    }

    if (terrain) {
      const samples = Math.max(1, Math.ceil(length / step));
      for (let s = 0; s <= samples; s++) {
        const t = s / samples;
        const p = lerpPoint(a, b, t);
        const ground = terrain(p[0], p[1]);
        if (ground !== null && p[2] < ground + clearance) {
          consider({ kind: "terrain", point: p, distance: offset + t * length });
        }
      }
    }
    offset += length;
  }
  return best;
}

export function lineOfSight(from: Vec3, to: Vec3, options: PathOptions = {}): boolean {
  return firstObstruction([from, to], options) === null;
}

export function ballisticArc(from: Vec3, to: Vec3, apexRise: number, segments = 64): Vec3[] {
  if (apexRise < 0) throw new Error("apexRise must not be negative");
  if (segments < 2) throw new Error("segments must be at least 2");
  const slope = to[2] - from[2];
  const peak = Math.max(from[2], to[2]) + apexRise;
  const k = peak - (from[2] + to[2]) / 2;
  const h = (k + Math.sqrt(Math.max(0, k * k - (slope * slope) / 4))) / 2;
  const points: Vec3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    points.push([
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t,
      from[2] + slope * t + 4 * h * t * (1 - t),
    ]);
  }
  points[0] = from;
  points[segments] = to;
  return points;
}
