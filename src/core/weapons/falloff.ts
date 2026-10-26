import type { Weapon } from "@/core/data";

export interface FalloffPoint {
  distance: number;
  multiplier: number;
}

type FalloffWeapon = Pick<Weapon, "damageFalloff">;

function eased(t: number, interpolation: string | null | undefined): number {
  if (interpolation === "Constant") {
    return 0;
  }
  if (interpolation === "Cubic") {
    return t * t * (3 - 2 * t);
  }
  return t;
}

export function falloffAt(weapon: FalloffWeapon, distance: number): number {
  const points = weapon.damageFalloff ?? [];
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) {
    return 1;
  }
  if (distance <= first.distance) {
    return first.multiplier;
  }
  if (distance >= last.distance) {
    return last.multiplier;
  }
  let from = first;
  for (const to of points.slice(1)) {
    if (distance < to.distance) {
      const t = (distance - from.distance) / (to.distance - from.distance);
      return from.multiplier + (to.multiplier - from.multiplier) * eased(t, from.interpolation);
    }
    from = to;
  }
  return last.multiplier;
}

export function falloffSeries(weapon: FalloffWeapon, maxDistance: number, step: number): FalloffPoint[] {
  const distances: number[] = [];
  for (let index = 0; index * step < maxDistance; index++) {
    distances.push(index * step);
  }
  distances.push(maxDistance);
  return distances.map((distance) => ({ distance, multiplier: falloffAt(weapon, distance) }));
}
