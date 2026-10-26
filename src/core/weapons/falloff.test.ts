import { describe, expect, it } from "vitest";
import { falloffAt, falloffSeries } from "./falloff";
import { fixtureWeapon } from "./fixtures/gameData";

const ak74 = fixtureWeapon("Id.Item.AK74M");

describe("falloffAt", () => {
  it("holds full damage to 500 m and falls linearly to 0.2 at 1200 m on the AK74", () => {
    expect(falloffAt(ak74, 1)).toBe(1);
    expect(falloffAt(ak74, 500)).toBe(1);
    expect(falloffAt(ak74, 850)).toBeCloseTo(0.6);
    expect(falloffAt(ak74, 1200)).toBeCloseTo(0.2);
  });

  it("holds the first multiplier before the first point and the last after the last", () => {
    const weapon = {
      damageFalloff: [
        { distance: 100, multiplier: 0.9 },
        { distance: 200, multiplier: 0.5 },
      ],
    };
    expect(falloffAt(weapon, 0)).toBe(0.9);
    expect(falloffAt(weapon, 5000)).toBe(0.5);
  });

  it("holds a Constant segment until the next point", () => {
    const weapon = {
      damageFalloff: [
        { distance: 0, multiplier: 1, interpolation: "Constant" as const },
        { distance: 100, multiplier: 0.5 },
      ],
    };
    expect(falloffAt(weapon, 99)).toBe(1);
    expect(falloffAt(weapon, 100)).toBe(0.5);
  });

  it("puts the midpoint of a Cubic segment at the average", () => {
    const weapon = fixtureWeapon("Id.Item.WEPN_028");
    expect(falloffAt(weapon, 250)).toBeCloseTo(0.8);
    expect(falloffAt(weapon, 225)).toBeGreaterThan(0.9);
  });

  it("returns 1 without falloff data", () => {
    expect(falloffAt(fixtureWeapon("Id.Item.M500"), 300)).toBe(1);
    expect(falloffAt({ damageFalloff: [] }, 300)).toBe(1);
  });
});

describe("falloffSeries", () => {
  it("returns evenly spaced points including both ends", () => {
    expect(falloffSeries(ak74, 1200, 300).map((point) => point.distance)).toEqual([0, 300, 600, 900, 1200]);
    expect(falloffSeries(ak74, 1200, 300)[3]?.multiplier).toBeCloseTo(1 - (0.8 * 400) / 700);
  });

  it("ends at the maximum distance when the step does not divide it", () => {
    expect(falloffSeries(ak74, 250, 100).map((point) => point.distance)).toEqual([0, 100, 200, 250]);
  });
});
