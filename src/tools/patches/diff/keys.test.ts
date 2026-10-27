import { describe, expect, it } from "vitest";
import { byDamageRule, byFields, byProjectile, damageRuleKey } from "./keys";

describe("byFields", () => {
  it("keys records case-insensitively", () => {
    const [from] = byFields("id")([{ id: "ID.Item.A91Barrel" }]);
    const [to] = byFields("id")([{ id: "Id.Item.A91Barrel" }]);
    expect(from).toBe(to);
  });

  it("joins several fields", () => {
    expect(byFields("action", "context")([{ action: "Kill", context: "DefaultReward" }])).toEqual([
      "kill|defaultreward",
    ]);
  });
});

describe("byProjectile", () => {
  it("uses the id alone when it is unique", () => {
    expect(byProjectile([{ id: "Item.Caliber.545mm", asset: "a" }])).toEqual(["item.caliber.545mm"]);
  });

  it("adds the asset when an id repeats in the build", () => {
    const keys = byProjectile([
      { id: "Item.Caliber.84mm", asset: "Content/A/DA_84mm_HE" },
      { id: "Item.Caliber.84mm", asset: "Content/A/DA_84mm_HEAT" },
      { id: "Item.Caliber.545mm", asset: "Content/A/DA_545mm" },
    ]);
    expect(keys).toEqual([
      "item.caliber.84mm|content/a/da_84mm_he",
      "item.caliber.84mm|content/a/da_84mm_heat",
      "item.caliber.545mm",
    ]);
  });
});

describe("damage rule keys", () => {
  const rule = {
    entity: "Infantry",
    source: ["Bullet", "Kinetic.Impact"],
    target: [],
    instigator: [],
    hitLocations: ["Head", "Neck"],
    category: "Bone",
    operation: "Percentage_Ongoing",
    amount: -75,
  };

  it("is stable under tag order and ignores the amount", () => {
    const reordered = { ...rule, source: ["Kinetic.Impact", "Bullet"], hitLocations: ["Neck", "Head"], amount: -50 };
    expect(damageRuleKey(reordered)).toBe(damageRuleKey(rule));
  });

  it("differs when the tags differ", () => {
    expect(damageRuleKey({ ...rule, source: ["Explosive"] })).not.toBe(damageRuleKey(rule));
    expect(damageRuleKey({ ...rule, custom: "B_BoneDamageModifiers_C" })).not.toBe(damageRuleKey(rule));
  });

  it("distinguishes exact duplicates with an occurrence counter", () => {
    const keys = byDamageRule([rule, { ...rule }, { ...rule, source: ["Explosive"] }]);
    expect(new Set(keys).size).toBe(3);
    expect(keys[1]).toBe(`${keys[0]}#2`);
  });
});
