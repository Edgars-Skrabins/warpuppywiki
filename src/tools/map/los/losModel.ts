import {
  ballisticArc,
  distance2d,
  elevationProfile,
  firstObstruction,
  type Box,
  type HeightFn,
  type Vec2,
  type Vec3,
} from "@/core/maps";
import { formatDistance } from "@/ui";
import { LOS_STEP } from "./constants";

export const PROFILE_MAX_POINTS = 600;

export type LosPathType = "direct" | "indirect";

export interface LosBox extends Box {
  id: string;
  label: string;
}

export interface LosInputs {
  observer: Vec2;
  target: Vec2;
  eyeHeight: number;
  targetHeight: number;
  includeBuildings: boolean;
  path: LosPathType;
  apex: number;
}

export interface LosObstruction {
  kind: "terrain" | "building";
  label: string;
  point: Vec3;
  distance: number;
}

export interface ProfileSample {
  distance: number;
  ground: number | null;
  sight: number;
}

export interface CrossedBuilding {
  id: string;
  label: string;
  from: number;
  to: number;
  top: number;
}

export interface LosResult {
  clear: boolean;
  obstruction: LosObstruction | null;
  length: number;
  observerZ: number;
  targetZ: number;
  path: Vec3[];
  profile: ProfileSample[];
  buildings: CrossedBuilding[];
}

function footprintCrossing(from: Vec2, to: Vec2, box: Box): [number, number] | null {
  let tMin = 0;
  let tMax = 1;
  for (let axis = 0; axis < 2; axis++) {
    const start = from[axis]!;
    const delta = to[axis]! - start;
    const lo = Math.min(box.min[axis]!, box.max[axis]!);
    const hi = Math.max(box.min[axis]!, box.max[axis]!);
    if (Math.abs(delta) < 1e-9) {
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
  return [tMin, tMax];
}

export function sightHeightAt(path: readonly Vec3[], fraction: number): number {
  if (path.length === 1) return path[0]![2];
  const position = Math.min(Math.max(fraction, 0), 1) * (path.length - 1);
  const index = Math.min(Math.floor(position), path.length - 2);
  const t = position - index;
  return path[index]![2] + (path[index + 1]![2] - path[index]![2]) * t;
}

export function runLos(inputs: LosInputs, heightAt: HeightFn, boxes: readonly LosBox[]): LosResult | null {
  const { observer, target } = inputs;
  const observerGround = heightAt(observer[0], observer[1]);
  const targetGround = heightAt(target[0], target[1]);
  if (observerGround === null || targetGround === null) {
    return null;
  }
  const observerZ = observerGround + inputs.eyeHeight;
  const targetZ = targetGround + inputs.targetHeight;
  const from: Vec3 = [observer[0], observer[1], observerZ];
  const to: Vec3 = [target[0], target[1], targetZ];
  const path = inputs.path === "indirect" ? ballisticArc(from, to, Math.max(0, inputs.apex)) : [from, to];
  const length = distance2d(observer, target);
  const buildings = inputs.includeBuildings ? boxes : [];
  const found = firstObstruction(path, { terrain: heightAt, buildings, step: LOS_STEP });
  const labels = new Map(boxes.map((box) => [box.id, box.label]));
  const obstruction: LosObstruction | null =
    found === null
      ? null
      : {
          kind: found.kind,
          label: found.kind === "building" ? (labels.get(found.buildingId ?? "") ?? "Building") : "Terrain",
          point: found.point,
          distance: distance2d(observer, found.point),
        };

  const step = Math.max(LOS_STEP, length / PROFILE_MAX_POINTS);
  const profile = elevationProfile({ heightAt }, observer, target, step).map((point) => ({
    distance: point.distance,
    ground: point.z,
    sight: sightHeightAt(path, length === 0 ? 0 : point.distance / length),
  }));

  const crossed: CrossedBuilding[] = [];
  for (const box of buildings) {
    const span = footprintCrossing(observer, target, box);
    if (span !== null) {
      crossed.push({
        id: box.id,
        label: box.label,
        from: span[0] * length,
        to: span[1] * length,
        top: Math.max(box.min[2], box.max[2]),
      });
    }
  }
  crossed.sort((a, b) => a.from - b.from);

  return { clear: obstruction === null, obstruction, length, observerZ, targetZ, path, profile, buildings: crossed };
}

export function resultLabel(result: LosResult): string {
  const distance = formatDistance(result.length);
  if (result.obstruction === null) {
    return `${distance} · Clear`;
  }
  const by = result.obstruction.kind === "terrain" ? "terrain" : result.obstruction.label.toLowerCase();
  return `Blocked at ${formatDistance(Math.round(result.obstruction.distance))} by ${by}`;
}
