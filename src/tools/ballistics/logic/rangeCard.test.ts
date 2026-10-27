import { describe, expect, it } from "vitest";
import { fixtureProjectile } from "../fixtures/projectiles";
import { cardDistances, heightAboveBore, holdoverMils, rangeCard } from "./rangeCard";
import { ballisticProjectileOf, simulate } from "./trajectory";

const caliber545 = ballisticProjectileOf(fixtureProjectile("Item.Caliber.545mm"))!;

function card(maxDistance: number, targetSpeed: number | null = null, falloff: (distance: number) => number = () => 1) {
  const samples = simulate(caliber545, 880, 0, maxDistance);
  return rangeCard({ samples, massKg: caliber545.massKg, baseDamage: 40, falloff, targetSpeed });
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

describe("heightAboveBore", () => {
  it("is the sample's height", () => {
    const sample = simulate(caliber545, 880, 0, 100)[100]!;
    expect(heightAboveBore(sample)).toBe(sample.height);
  });
});

describe("rangeCard", () => {
  it("shows the bullet falling further below the bore with distance", () => {
    const rows = card(600);
    expect(rows.every((row) => row.dropCm < 0)).toBe(true);
    for (let i = 1; i < rows.length; i++) expect(rows[i]!.dropCm).toBeLessThan(rows[i - 1]!.dropCm);
  });

  it("gives the hold above the bore as a positive number of mils", () => {
    const row = card(600).find((r) => r.distance === 600)!;
    expect(row.mils).toBeGreaterThan(0);
    expect(row.mils).toBe(holdoverMils(-row.dropCm / 100, 600));
  });

  it("has no lead without a target speed", () => {
    expect(card(600).every((row) => row.lead === null)).toBe(true);
  });

  it("leads by flight time times the target speed", () => {
    const row = card(600, 7).find((r) => r.distance === 500)!;
    expect(row.lead).toBeCloseTo(row.time * 7, 9);
  });

  it("scales damage per hit by the falloff and derives energy", () => {
    const row = card(600, null, (d) => (d >= 500 ? 0.5 : 1)).find((r) => r.distance === 500)!;
    expect(row.falloff).toBe(0.5);
    expect(row.damage).toBe(20);
    expect(row.energy).toBeCloseTo(0.5 * 0.0034 * row.velocity ** 2, 9);
  });
});
