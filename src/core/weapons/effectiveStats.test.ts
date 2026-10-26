import { describe, expect, it } from "vitest";
import { effectiveStats, type FittedAttachment } from "./effectiveStats";
import { fixtureAttachment, fixtureWeapon } from "./fixtures/gameData";

const ak74 = fixtureWeapon("Id.Item.AK74M");

function fitted(slot: string, id: string): FittedAttachment {
  return { slot, attachment: fixtureAttachment(id), hiddenDefault: false };
}

describe("effectiveStats", () => {
  it("returns the weapon's own stats with no attachments", () => {
    const stats = effectiveStats(ak74, []);
    expect(stats.adsTime?.value).toBeCloseTo(0.8);
    expect(stats.verticalRecoil.value).toBe(1);
    expect(stats.horizontalRecoil.value).toBe(1);
    expect(stats.zoom.value).toBe(1);
    expect(stats.randomDeviation).toBe(13);
    expect(stats.zeroingMin).toBeNull();
    expect(stats.zeroingMax?.value).toBe(1000);
    expect(stats.magazineCapacity).toBeNull();
    expect(stats.character).toEqual({});
  });

  it("applies the 60-round magazine's modifiers and capacity", () => {
    const stats = effectiveStats(ak74, [fitted("Magazine", "Id.Item.AK74MExtendedMagazine")]);
    expect(stats.adsTime?.value).toBeCloseTo(0.8 * 1.19);
    expect(stats.verticalRecoil.value).toBeCloseTo(1.19);
    expect(stats.horizontalRecoil.value).toBeCloseTo(1.21);
    expect(stats.equipSpeed.value).toBeCloseTo(0.93);
    expect(stats.magazineCapacity).toBe(60);
    expect(stats.character["Character.AimSwayScaleMultiplier"]?.value).toBeCloseTo(1.21);
  });

  it("overrides zoom and zeroing with the 3x scope", () => {
    const stats = effectiveStats(ak74, [fitted("Sight", "Id.Item.3xScope")]);
    expect(stats.zoom.value).toBe(3);
    expect(stats.zoom.overridden).toBe(true);
    expect(stats.zeroingMin?.value).toBe(100);
    expect(stats.zeroingMax?.value).toBe(300);
  });

  it("multiplies ADS time by an extra source's character ADS multiplier", () => {
    const armor = {
      label: "Heavy armor",
      modifiers: [{ attribute: "Character.AdsTimeMultiplier", op: "multiplyCompound" as const, value: 1.05 }],
    };
    const stats = effectiveStats(ak74, [fitted("Magazine", "Id.Item.AK74MExtendedMagazine")], [armor]);
    expect(stats.adsTime?.value).toBeCloseTo(0.8 * 1.19 * 1.05);
    expect(stats.adsTime?.steps).toHaveLength(2);
    expect(stats.adsTime?.steps[1]?.source).toBe("Heavy armor");
    expect(stats.adsTime?.steps.at(-1)?.after).toBeCloseTo(0.8 * 1.19 * 1.05);
  });

  it("returns no ADS time for a weapon without one", () => {
    expect(effectiveStats(fixtureWeapon("Id.Item.M4"), []).adsTime).toBeNull();
  });
});
