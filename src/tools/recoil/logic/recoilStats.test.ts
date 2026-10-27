import { describe, expect, it } from "vitest";
import { sameId } from "@/core/catalog";
import { WeaponsFile } from "@/core/data/schemas/weapons";
import weaponsJson from "@/test/fixtures/data/25937608/weapons.json";
import { recoilStats } from "./recoilStats";

const weapons = WeaponsFile.parse(weaponsJson).weapons;
const ak = weapons.find((weapon) => sameId(weapon.id, "Id.Item.AK74M"))!;
const mosin = weapons.find((weapon) => sameId(weapon.id, "Id.Item.Mosin"))!;

describe("recoilStats", () => {
  it("sums the AK74 pattern and finds its widest sideways point", () => {
    const stats = recoilStats(ak.recoil, { vertical: 1, horizontal: 1 });
    const pattern = ak.recoil!.pattern;
    let x = 0;
    let widest = 0;
    for (const kick of pattern) {
      x += kick.x;
      widest = Math.max(widest, Math.abs(x));
    }
    expect(stats.patternLength).toBe(30);
    expect(stats.verticalClimb).toBeCloseTo(32.459341, 6);
    expect(stats.horizontalDrift).toBeCloseTo(0.62, 6);
    expect(stats.maxSideways).toBeCloseTo(widest, 9);
    expect(stats.patternResetTime).toBe(0.65);
    expect(stats.afterPatternPitch).toEqual([0.45, 0.75]);
    expect(stats.afterPatternYaw).toEqual([-0.28, 0.28]);
  });

  it("measures the widest sideways point, not the end drift", () => {
    const pattern = [
      { x: -1, y: 1 },
      { x: -2, y: 1 },
      { x: 4, y: 1 },
    ];
    const stats = recoilStats({ ...ak.recoil!, pattern }, { vertical: 1, horizontal: 1 });
    expect(stats.horizontalDrift).toBe(1);
    expect(stats.maxSideways).toBe(3);
  });

  it("scales totals and after-pattern ranges by the multipliers", () => {
    const stats = recoilStats(ak.recoil, { vertical: 2, horizontal: 0.5 });
    expect(stats.verticalClimb).toBeCloseTo(32.459341 * 2, 6);
    expect(stats.horizontalDrift).toBeCloseTo(0.31, 6);
    expect(stats.afterPatternPitch![1]).toBeCloseTo(1.5, 9);
    expect(stats.afterPatternYaw![0]).toBeCloseTo(-0.14, 9);
  });

  it("reports an empty pattern as zero shots", () => {
    const stats = recoilStats(mosin.recoil, { vertical: 1, horizontal: 1 });
    expect(stats).toMatchObject({ patternLength: 0, verticalClimb: 0, horizontalDrift: 0, maxSideways: 0 });
  });
});
