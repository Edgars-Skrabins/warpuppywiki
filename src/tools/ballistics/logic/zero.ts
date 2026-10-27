import { simulate, type BallisticProjectile } from "./trajectory";

export const SIGHT_HEIGHT = 0.05;
export const MAX_LAUNCH_ANGLE = 0.2;
const ITERATIONS = 50;

function heightAt(projectile: BallisticProjectile, muzzleVelocity: number, angle: number, distance: number): number {
  const sample = simulate(projectile, muzzleVelocity, angle, distance)[distance];
  return sample ? sample.height : Number.NEGATIVE_INFINITY;
}

export function solveLaunchAngle(
  projectile: BallisticProjectile,
  muzzleVelocity: number,
  zeroDistance: number,
  sightHeight: number = SIGHT_HEIGHT,
): number {
  let low = 0;
  let high = MAX_LAUNCH_ANGLE;
  if (heightAt(projectile, muzzleVelocity, high, zeroDistance) < sightHeight) return high;
  for (let i = 0; i < ITERATIONS; i++) {
    const mid = (low + high) / 2;
    if (heightAt(projectile, muzzleVelocity, mid, zeroDistance) < sightHeight) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}
