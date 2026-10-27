import type { Weapon } from "@/core/data";
import { recoilPath, type Range, type RecoilMultipliers } from "./recoilPath";

export interface RecoilStatsSummary {
  patternLength: number;
  verticalClimb: number;
  horizontalDrift: number;
  maxSideways: number;
  patternResetTime: number | null;
  viewKickMultiplier: number | null;
  afterPatternPitch: Range | null;
  afterPatternYaw: Range | null;
}

function scaleRange(range: Range | null | undefined, multiplier: number): Range | null {
  return range == null ? null : [range[0] * multiplier, range[1] * multiplier];
}

export function recoilStats(recoil: Weapon["recoil"], multipliers: RecoilMultipliers): RecoilStatsSummary {
  const { points } = recoilPath(recoil?.pattern ?? [], multipliers, null, null, null);
  const last = points[points.length - 1];
  return {
    patternLength: points.length,
    verticalClimb: last?.y ?? 0,
    horizontalDrift: last?.x ?? 0,
    maxSideways: points.reduce((max, point) => Math.max(max, Math.abs(point.x)), 0),
    patternResetTime: recoil?.patternResetTime ?? null,
    viewKickMultiplier: recoil?.viewKickMultiplier ?? null,
    afterPatternPitch: scaleRange(recoil?.afterPatternPitch, multipliers.vertical),
    afterPatternYaw: scaleRange(recoil?.afterPatternYaw, multipliers.horizontal),
  };
}
