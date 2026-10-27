import { bearingDegrees, distance2d, distance3d, type HeightFn, type Vec2 } from "@/core/maps";

export interface Segment {
  from: Vec2;
  to: Vec2;
  midpoint: Vec2;
  length: number;
  bearing: number;
}

export interface Measurement {
  segments: Segment[];
  total: number;
  straight: number;
  threeD: boolean;
}

function finite(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}

function lengthBetween(from: Vec2, to: Vec2, heightAt: HeightFn | null): number {
  if (heightAt !== null) {
    const fromHeight = heightAt(from[0], from[1]);
    const toHeight = heightAt(to[0], to[1]);
    if (finite(fromHeight) && finite(toHeight)) {
      return distance3d([from[0], from[1], fromHeight], [to[0], to[1], toHeight]);
    }
  }
  return distance2d(from, to);
}

export function measurePath(points: readonly Vec2[], heightAt: HeightFn | null = null): Measurement {
  const segments: Segment[] = [];
  for (let index = 1; index < points.length; index++) {
    const from = points[index - 1]!;
    const to = points[index]!;
    segments.push({
      from,
      to,
      midpoint: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2],
      length: lengthBetween(from, to, heightAt),
      bearing: bearingDegrees(from, to),
    });
  }
  const first = points[0];
  const last = points.at(-1);
  return {
    segments,
    total: segments.reduce((sum, segment) => sum + segment.length, 0),
    straight: first !== undefined && last !== undefined ? lengthBetween(first, last, heightAt) : 0,
    threeD: heightAt !== null,
  };
}

export function formatBearing(degrees: number): string {
  return `${String(Math.round(degrees) % 360).padStart(3, "0")}°`;
}
