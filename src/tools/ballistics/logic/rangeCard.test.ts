import { describe, expect, it } from "vitest";
import { fixtureProjectile } from "../fixtures/projectiles";
import { cardDistances, holdoverMils, rangeCard } from "./rangeCard";
import { ballisticProjectileOf, simulate } from "./trajectory";
import { solveLaunchAngle } from "./zero";

const caliber545 = ballisticProjectileOf(fixtureProjectile("Item.Caliber.545mm"))!;

function card(zero: number, maxDistance: number, falloff: (distance: number) => number = () => 1) {
  const samples = simulate(caliber545, 880, solveLaunchAngle(caliber545, 880, zero), maxDistance);
  return rangeCard({ samples, massKg: caliber545.massKg, baseDamage: 40, falloff });
}

describe("cardDistances", () => {
  it("steps 25 m to 300 m and 50 m beyond", () => {
    expect(cardDistances(450)).toEqual([25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 350, 400, 450]);
    expect(cardDistances(300)).toHaveLength(12);
  });
});

describe("holdoverMils", () => {
  it("divides drop by distance in thousandths, rounded to 0.1", () => {
    expect(holdoverMils(-0.52, 400)).toBe(-1.3);
    expect(holdoverMils(0.123, 100)).toBe(1.2);
  });
});

describe("rangeCard", () => {
  it("has no drop at the zero distance", () => {
    const row = card(300, 600).find((r) => r.distance === 300)!;
    expect(Math.abs(row.dropCm)).toBeLessThan(0.1);
    expect(row.mils).toBe(0);
  });

  it("shows the bullet below the sight line beyond the zero", () => {
    const row = card(100, 600).find((r) => r.distance === 600)!;
    expect(row.dropCm).toBeLessThan(0);
    expect(row.mils).toBe(holdoverMils(row.dropCm / 100, 600));
  });

  it("scales damage per hit by the falloff and derives energy and lead", () => {
    const row = card(100, 600, (d) => (d >= 500 ? 0.5 : 1)).find((r) => r.distance === 500)!;
    expect(row.falloff).toBe(0.5);
    expect(row.damage).toBe(20);
    expect(row.energy).toBeCloseTo(0.5 * 0.0034 * row.velocity ** 2, 9);
    expect(row.lead).toBeCloseTo(row.time * 5, 9);
  });
});
