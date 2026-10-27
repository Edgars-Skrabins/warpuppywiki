import { describe, expect, it } from "vitest";
import { locationTag, sourceTags, targetTags } from "./hitTags";
import { newPiece, testAmmo, testArmor, testTarget, testWeapon } from "./testData";

describe("sourceTags", () => {
  it("describes an AK74 firing 5.45 HP (T)", () => {
    const tags = sourceTags(testWeapon("Id.Item.AK74M"), testAmmo("Id.Item.545mm.HollowPoint.Tracer"));
    expect(tags).toEqual(
      expect.arrayContaining([
        "Bullet",
        "Bullet.545mm",
        "AmmoModifier.HollowPoint.Tracer",
        "Arms.Medium",
        "Weapon.AR",
        "Weapon.AR.AK47M",
      ]),
    );
  });

  it("adds no ammo modifier for plain FMJ and AmmoModifier.Tracer for FMJ tracer", () => {
    const weapon = testWeapon("Id.Item.AK74M");
    expect(sourceTags(weapon, testAmmo("Id.Item.545mm")).some((tag) => tag.startsWith("AmmoModifier"))).toBe(false);
    expect(sourceTags(weapon, testAmmo("Id.Item.545mm.Tracer"))).toContain("AmmoModifier.Tracer");
  });
});

describe("targetTags", () => {
  it("returns the covering body armor's context only where it covers", () => {
    const target = testTarget({ body: newPiece("Id.Item.HeavyArmor") });
    expect(targetTags(target, "Torso.Upper")).toEqual(["Armor.Heavy"]);
    expect(targetTags(target, "Head")).toEqual([]);
  });

  it("covers the neck only with helmets that list it", () => {
    expect(targetTags(testTarget({ helmet: newPiece("Id.Item.LightHelmet") }), "Neck")).toEqual([]);
    expect(targetTags(testTarget({ helmet: newPiece("Id.Item.HeavyHelmet") }), "Neck")).toEqual(["Helmet.Heavy"]);
  });

  it("drops a piece with no durability left", () => {
    const target = testTarget({ body: { armor: testArmor("Id.Item.HeavyArmor"), durability: 0 } });
    expect(targetTags(target, "Torso.Upper")).toEqual([]);
  });

  it("adds a ghillie suit's context everywhere", () => {
    const target = testTarget({ body: newPiece("Id.Item.GhillieArmor"), helmet: newPiece("Id.Item.HeavyHelmet") });
    expect(targetTags(target, "Head")).toEqual(["Helmet.Heavy", "Armor.Ghillie"]);
    expect(targetTags(target, "Leg.Foot")).toEqual(["Armor.Ghillie"]);
  });
});

describe("locationTag", () => {
  it("prefixes the location with Infantry", () => {
    expect(locationTag("Torso.Upper")).toBe("Infantry.Torso.Upper");
  });
});
