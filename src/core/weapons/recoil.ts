import type { Weapon } from "@/core/data";
import type { EffectiveStats } from "./effectiveStats";

export interface RecoilPoint {
  x: number;
  y: number;
}

export function scaledRecoilPattern(
  weapon: Pick<Weapon, "recoil">,
  stats: Pick<EffectiveStats, "verticalRecoil" | "horizontalRecoil">,
): RecoilPoint[] {
  return (weapon.recoil?.pattern ?? []).map((point) => ({
    x: point.x * stats.horizontalRecoil.value,
    y: point.y * stats.verticalRecoil.value,
  }));
}

export function cumulativeRecoil(pattern: readonly RecoilPoint[]): RecoilPoint[] {
  let x = 0;
  let y = 0;
  const sums: RecoilPoint[] = [{ x, y }];
  for (const point of pattern) {
    x += point.x;
    y += point.y;
    sums.push({ x, y });
  }
  return sums;
}
