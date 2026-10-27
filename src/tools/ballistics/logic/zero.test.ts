import { describe, expect, it } from "vitest";
import { fixtureProjectile } from "../fixtures/projectiles";
import { ballisticProjectileOf, simulate } from "./trajectory";
import { SIGHT_HEIGHT, solveLaunchAngle } from "./zero";

const caliber545 = ballisticProjectileOf(fixtureProjectile("Item.Caliber.545mm"))!;

function farCrossing(zero: number): number {
  const angle = solveLaunchAngle(caliber545, 880, zero);
  const samples = simulate(caliber545, 880, angle, zero + 50);
  for (let i = samples.length - 1; i > 0; i--) {
    const before = samples[i - 1]!.height - SIGHT_HEIGHT;
    const after = samples[i]!.height - SIGHT_HEIGHT;
    if (before >= 0 && after < 0) return i - 1 + before / (before - after);
  }
  throw new Error("No crossing");
}

describe("solveLaunchAngle", () => {
  it.each([100, 300])("crosses the sight line at a %i m zero", (zero) => {
    expect(Math.abs(farCrossing(zero) - zero)).toBeLessThan(0.001);
  });

  it("needs a higher bore angle for a longer zero", () => {
    expect(solveLaunchAngle(caliber545, 880, 300)).toBeGreaterThan(solveLaunchAngle(caliber545, 880, 100));
  });
});
