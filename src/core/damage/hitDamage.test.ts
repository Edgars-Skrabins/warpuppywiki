import { describe, expect, it } from "vitest";
import { hitDamage } from "./hitDamage";
import { damageFile, newPiece, rounded, testAmmo, testTarget, testWeapon, weaponAmmo } from "./testData";
import type { HitInput } from "./types";

const ak74 = testWeapon("Id.Item.AK74M");
const fmj = weaponAmmo(ak74, "Id.Item.545mm");

function ak74Hit(overrides: Partial<HitInput> = {}): ReturnType<typeof hitDamage> {
  return hitDamage({
    damage: damageFile,
    weapon: ak74,
    ammo: fmj,
    distance: 100,
    location: "Torso.Upper",
    target: testTarget(),
    ...overrides,
  });
}

function stepOrder(steps: ReturnType<typeof hitDamage>["steps"]): string[] {
  return steps.map((step) => (step.ruleIndex === undefined ? step.kind : `${step.kind} ${step.ruleIndex}`));
}

describe("hitDamage", () => {
  it("deals 26 × 1 × 0.885 to an unarmored upper chest at 100 m", () => {
    const hit = ak74Hit();
    expect(hit.healthDamage).toBeCloseTo(26 * 1 * 0.885, 10);
    expect(hit.armorDamage).toBe(0);
    expect(hit.armorPiece).toBeNull();
    expect(stepOrder(hit.steps)).toEqual(["base", "falloff", "location", "skipped 18", "rule 43", "skipped 102"]);
    expect(hit.steps.map((step) => rounded(step.after))).toEqual([26, 26, 23.01, 23.01, 23.01, 23.01]);
  });

  it("deals 26 × 2.35 to an unarmored head", () => {
    expect(ak74Hit({ location: "Head" }).healthDamage).toBeCloseTo(26 * 2.35, 10);
  });

  it("deals 26 × 0.6 × 0.885 at 850 m", () => {
    const hit = ak74Hit({ distance: 850 });
    expect(hit.healthDamage).toBeCloseTo(26 * 0.6 * 0.885, 10);
    expect(hit.steps[1]?.factor).toBeCloseTo(0.6, 10);
  });

  it("doubles the damage with hollow points from the +100% rule", () => {
    const hit = ak74Hit({ ammo: weaponAmmo(ak74, "Id.Item.545mm.HollowPoint") });
    expect(hit.healthDamage).toBeCloseTo(26 * 0.885 * 2, 10);
    expect(stepOrder(hit.steps)).toEqual([
      "base",
      "falloff",
      "location",
      "skipped 18",
      "rule 25",
      "rule 43",
      "skipped 102",
    ]);
  });

  it("halves FMJ against new Level 3 armor and wears it by 23.01 × 0.4", () => {
    const hit = ak74Hit({ target: testTarget({ body: newPiece("Id.Item.HeavyArmor") }) });
    expect(hit.healthDamage).toBeCloseTo(23.01 * (1 - 0.5), 10);
    expect(hit.armorPiece).toBe("body");
    expect(hit.armorDamage).toBeCloseTo(23.01 * 0.4, 10);
    expect(stepOrder(hit.steps)).toEqual([
      "base",
      "falloff",
      "location",
      "skipped 18",
      "rule 43",
      "skipped 102",
      "armor",
    ]);
    expect(stepOrder(hit.armorSteps)).toEqual(["location", "rule 2"]);
  });

  it("applies −20% and a 50% × 0.6 reduction to AP against new Level 3 armor and wears it by × 0.4 × 1.3", () => {
    const hit = ak74Hit({
      ammo: weaponAmmo(ak74, "Id.Item.545mm.ArmorPiercing"),
      target: testTarget({ body: newPiece("Id.Item.HeavyArmor") }),
    });
    expect(hit.healthDamage).toBeCloseTo(23.01 * 0.8 * (1 - 0.3), 10);
    expect(hit.armorDamage).toBeCloseTo(23.01 * 1.3 * 0.4, 10);
    expect(stepOrder(hit.steps)).toEqual([
      "base",
      "falloff",
      "location",
      "skipped 18",
      "rule 23",
      "rule 43",
      "skipped 102",
      "armor",
    ]);
    expect(hit.steps.at(-1)?.factor).toBeCloseTo(0.7, 10);
    expect(stepOrder(hit.armorSteps)).toEqual(["location", "rule 1", "rule 2"]);
  });

  it("applies the hollow point armor rules only where armor covers", () => {
    const hit = ak74Hit({
      ammo: weaponAmmo(ak74, "Id.Item.545mm.HollowPoint"),
      target: testTarget({ body: newPiece("Id.Item.HeavyArmor") }),
    });
    expect(hit.healthDamage).toBeCloseTo(23.01 * 2 * 0.45 * 0.6 * (1 - 0.75), 10);
    expect(hit.armorDamage).toBeCloseTo(23.01 * 0.7 * 0.4, 10);
  });

  it("deals no damage when the ammo has no projectile", () => {
    const hit = ak74Hit({
      ammo: testAmmo("Id.Item.AK74M"),
      target: testTarget({ body: newPiece("Id.Item.HeavyArmor") }),
    });
    expect(hit.healthDamage).toBe(0);
    expect(hit.armorDamage).toBe(0);
  });

  it("lets a spent piece stop protecting", () => {
    const body = { ...newPiece("Id.Item.HeavyArmor"), durability: 0 };
    const hit = ak74Hit({ target: testTarget({ body }) });
    expect(hit.healthDamage).toBeCloseTo(23.01, 10);
    expect(hit.armorPiece).toBeNull();
  });
});
