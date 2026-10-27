import { describe, expect, it } from "vitest";
import { coveringPiece, effectiveness, wearStage } from "./armor";
import { damageFile, newPiece, testArmor, testTarget } from "./testData";

describe("wearStage", () => {
  const heavy = testArmor("Id.Item.HeavyArmor");

  it.each([
    [250, 0],
    [187.5, 1],
    [62.5, 3],
    [1, 3],
    [0, 3],
  ])("%s of 250 durability is stage %i", (durability, stage) => {
    expect(wearStage(heavy, durability)).toBe(stage);
  });
});

describe("coveringPiece", () => {
  it("picks the helmet for the head and the body armor for the torso", () => {
    const target = testTarget({ body: newPiece("Id.Item.HeavyArmor"), helmet: newPiece("Id.Item.HeavyHelmet") });
    expect(coveringPiece(target, "Head")?.slot).toBe("helmet");
    expect(coveringPiece(target, "Torso.Middle")?.slot).toBe("body");
    expect(coveringPiece(target, "Leg.Thigh")).toBeNull();
  });
});

describe("effectiveness", () => {
  it("uses the per-arms-class value for armor piercing", () => {
    expect(effectiveness(damageFile, "ArmorPiercing", "Medium")).toBe(0.6);
  });

  it("uses the modifier when the arms class is not listed", () => {
    expect(effectiveness(damageFile, "HollowPoint", "Medium")).toBe(1.5);
  });

  it("is 1 for FMJ and for ammo types not in the table", () => {
    expect(effectiveness(damageFile, "FMJ", "Medium")).toBe(1);
    expect(effectiveness(damageFile, "Buckshot", "Small")).toBe(1);
  });
});
