import { cumulativeRecoil } from "@/core/weapons";

export interface Vector {
  x: number;
  y: number;
}

export interface PathPoint extends Vector {
  shot: number;
}

export interface RecoilMultipliers {
  vertical: number;
  horizontal: number;
}

export type Range = readonly [number, number];

export interface RecoilCone {
  lower: Vector[];
  upper: Vector[];
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface RecoilPath {
  points: PathPoint[];
  cone: RecoilCone | null;
  bounds: Bounds;
}

const ORIGIN_BOUNDS: Bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };

function extend(bounds: Bounds, point: Vector): Bounds {
  return {
    minX: Math.min(bounds.minX, point.x),
    maxX: Math.max(bounds.maxX, point.x),
    minY: Math.min(bounds.minY, point.y),
    maxY: Math.max(bounds.maxY, point.y),
  };
}

function coneEdge(start: Vector, step: Vector, shots: number): Vector[] {
  return Array.from({ length: shots + 1 }, (_, k) => ({ x: start.x + step.x * k, y: start.y + step.y * k }));
}

export function recoilPath(
  pattern: readonly Vector[],
  multipliers: RecoilMultipliers,
  capacity: number | null,
  afterPitch: Range | null,
  afterYaw: Range | null,
): RecoilPath {
  const shown = capacity === null ? pattern : pattern.slice(0, Math.max(0, capacity));
  const points: PathPoint[] = cumulativeRecoil(
    shown.map((kick) => ({ x: kick.x * multipliers.horizontal, y: kick.y * multipliers.vertical })),
  )
    .slice(1)
    .map((sum, index) => ({ ...sum, shot: index + 1 }));

  const extraShots = capacity === null ? 0 : capacity - pattern.length;
  const last = points[points.length - 1];
  const cone =
    last !== undefined && extraShots > 0 && (afterPitch != null || afterYaw != null)
      ? {
          lower: coneEdge(
            last,
            { x: (afterYaw?.[0] ?? 0) * multipliers.horizontal, y: (afterPitch?.[0] ?? 0) * multipliers.vertical },
            extraShots,
          ),
          upper: coneEdge(
            last,
            { x: (afterYaw?.[1] ?? 0) * multipliers.horizontal, y: (afterPitch?.[1] ?? 0) * multipliers.vertical },
            extraShots,
          ),
        }
      : null;

  const bounds = [...points, ...(cone?.lower ?? []), ...(cone?.upper ?? [])].reduce(extend, ORIGIN_BOUNDS);
  return { points, cone, bounds };
}

function mirrorVector<T extends Vector>(point: T): T {
  return { ...point, x: -point.x, y: -point.y };
}

export function mirrorBounds(bounds: Bounds): Bounds {
  return { minX: -bounds.maxX, maxX: -bounds.minX, minY: -bounds.maxY, maxY: -bounds.minY };
}

export function mirrorPath(path: RecoilPath): RecoilPath {
  return {
    points: path.points.map(mirrorVector),
    cone: path.cone && { lower: path.cone.lower.map(mirrorVector), upper: path.cone.upper.map(mirrorVector) },
    bounds: mirrorBounds(path.bounds),
  };
}

export function unionBounds(bounds: readonly Bounds[]): Bounds {
  return bounds.reduce(
    (all, next) => extend(extend(all, { x: next.minX, y: next.minY }), { x: next.maxX, y: next.maxY }),
    ORIGIN_BOUNDS,
  );
}

const PADDING = 1.1;
const MIN_SIZE = 1;
const BASE_MARGIN = 0.25;

export function squareFrame(bounds: Bounds): Bounds {
  const halfWidth = Math.max(Math.abs(bounds.minX), Math.abs(bounds.maxX));
  const height = bounds.maxY - bounds.minY;
  const size = Math.max(halfWidth * 2, height, MIN_SIZE) * PADDING;
  const margin = (size - height) * BASE_MARGIN;
  const minY = bounds.maxY >= -bounds.minY ? bounds.minY - margin : bounds.maxY + margin - size;
  return { minX: -size / 2, maxX: size / 2, minY, maxY: minY + size };
}

const NICE_STEPS = [1, 2, 2.5, 5, 10];

export function gridTicks(min: number, max: number, target = 6): number[] {
  const span = max - min;
  if (span <= 0) {
    return [min];
  }
  const raw = span / target;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = (NICE_STEPS.find((candidate) => candidate * magnitude >= raw) ?? 10) * magnitude;
  const ticks: number[] = [];
  for (let tick = Math.ceil(min / step) * step; tick <= max + step * 1e-9; tick += step) {
    ticks.push(Math.abs(tick) < step * 1e-9 ? 0 : tick);
  }
  return ticks;
}
