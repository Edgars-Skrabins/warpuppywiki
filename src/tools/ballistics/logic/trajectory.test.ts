import { describe, expect, it } from "vitest";
import { fixtureProjectile } from "../fixtures/projectiles";
import { GRAVITY, ballisticProjectileOf, simulate, type BallisticProjectile } from "./trajectory";

const caliber545 = ballisticProjectileOf(fixtureProjectile("Item.Caliber.545mm"))!;

describe("ballisticProjectileOf", () => {
  it("reads mass, diameter and the drag form factor", () => {
    expect(caliber545).toEqual({ massKg: 0.0034, diameterMm: 5.6, formFactor: 1.4, dragModel: "G7" });
  });

  it("refuses projectiles without drag data or with propulsion", () => {
    const base = fixtureProjectile("Item.Caliber.545mm");
    expect(ballisticProjectileOf({ ...base, drag: null })).toBeNull();
    expect(ballisticProjectileOf({ ...base, massKg: null })).toBeNull();
    expect(ballisticProjectileOf({ ...base, propulsion: { thrustSpeed: 100 } })).toBeNull();
  });
});

describe("simulate", () => {
  it("matches the vacuum solution with drag disabled", () => {
    const vacuum: BallisticProjectile = { ...caliber545, formFactor: 0 };
    const samples = simulate(vacuum, 880, 0, 500);
    const t = 500 / 880;
    expect(samples).toHaveLength(501);
    expect(samples[500]!.time).toBeCloseTo(t, 6);
    expect(samples[500]!.height).toBeCloseTo(-0.5 * GRAVITY * t * t, 5);
  });

  it("slows the bullet down monotonically with drag", () => {
    const samples = simulate(caliber545, 880, 0, 1000);
    expect(samples.every((sample, i) => i === 0 || sample.velocity < samples[i - 1]!.velocity)).toBe(true);
  });

  it("keeps 5.45 mm at 880 m/s within physical bounds at 500 m", () => {
    const sample = simulate(caliber545, 880, 0, 500)[500]!;
    expect(sample.time).toBeGreaterThan(500 / 880);
    expect(sample.time).toBeLessThan(1.2);
    expect(sample.velocity).toBeGreaterThan(250);
  });

  it("pins the 5.45 mm time of flight to 500 m", () => {
    expect(Math.abs(simulate(caliber545, 880, 0, 500)[500]!.time - 0.958)).toBeLessThan(0.01);
  });

  it("samples every metre from the muzzle", () => {
    const samples = simulate(caliber545, 880, 0, 50);
    expect(samples.map((sample) => sample.distance)).toEqual(Array.from({ length: 51 }, (_, i) => i));
  });
});
