import type { DistancePoint } from "@/core/damage";
import { EMPTY_VALUE, formatNumber, formatSeconds } from "@/ui";

export const RELOAD_HINT = "The magazine runs out before the kill, so a reload is needed. Time to kill is not shown.";

export function pointText(point: DistancePoint): string {
  if (point.stk === null) {
    return EMPTY_VALUE;
  }
  const shots = formatNumber(point.stk);
  if (point.needsReload) {
    return `${shots} · reload`;
  }
  return `${shots} · ${formatSeconds(point.ttk)}`;
}

export function extraShotsText(extraShots: number | null): string {
  if (extraShots === null) {
    return EMPTY_VALUE;
  }
  if (extraShots === 0) {
    return "No change";
  }
  const sign = extraShots > 0 ? "+" : "−";
  const count = Math.abs(extraShots);
  return `${sign}${formatNumber(count)} ${count === 1 ? "shot" : "shots"}`;
}
