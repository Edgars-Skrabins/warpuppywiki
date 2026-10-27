import type { ShotResult } from "@/core/damage";

export function shotHealthDamage(shot: ShotResult | undefined): number | null {
  return shot === undefined ? null : shot.hits.reduce((sum, hit) => sum + hit.healthDamage, 0);
}
