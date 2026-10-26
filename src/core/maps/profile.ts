import { distance2d } from "./geometry";
import type { Heightmap } from "./heightmap";
import type { Vec2 } from "./types";

export interface ProfilePoint {
  distance: number;
  x: number;
  y: number;
  z: number | null;
}

export function elevationProfile(
  heightmap: Pick<Heightmap, "heightAt">,
  from: Vec2,
  to: Vec2,
  step: number,
): ProfilePoint[] {
  if (step <= 0) throw new Error("step must be positive");
  const length = distance2d(from, to);
  const samples = Math.max(1, Math.ceil(length / step));
  const points: ProfilePoint[] = [];
  for (let s = 0; s <= samples; s++) {
    const t = s / samples;
    const x = from[0] + (to[0] - from[0]) * t;
    const y = from[1] + (to[1] - from[1]) * t;
    points.push({ distance: length * t, x, y, z: heightmap.heightAt(x, y) });
  }
  return points;
}
