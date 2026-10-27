import { describe, expect, it } from "vitest";
import { damageFile } from "../fixtures/gameData";
import { applyingRuleIndexes, combinedMultipliers, isHitDescribed, type HitDescription } from "./applies";

const hpIntoLevel3UpperChest: HitDescription = {
  source: ["Bullet.762mm", "AmmoModifier.HollowPoint"],
  target: ["Armor.Heavy"],
  attacker: [],
  location: "Infantry.Torso.Upper",
};

describe("applyingRuleIndexes", () => {
  it("marks the HP +100% and HP vs armor −55% rules for HP into Level 3 armor at the upper chest", () => {
    const applying = applyingRuleIndexes(damageFile.rules, hpIntoLevel3UpperChest);
    expect(damageFile.rules[25]).toMatchObject({ entity: "Infantry", amount: 100 });
    expect(damageFile.rules[28]).toMatchObject({ entity: "Infantry", amount: -55 });
    expect(applying.has(25)).toBe(true);
    expect(applying.has(28)).toBe(true);
  });

  it("leaves out helmet-only, custom and friendly rules", () => {
    const applying = applyingRuleIndexes(damageFile.rules, hpIntoLevel3UpperChest);
    expect(applying.has(27)).toBe(false);
    expect(applying.has(17)).toBe(false);
    expect(applying.has(95)).toBe(false);
    expect(applying.has(20)).toBe(false);
  });

  it("lets a sub-tag satisfy a parent tag in source, target and location", () => {
    const applying = applyingRuleIndexes(damageFile.rules, {
      source: ["Bullet.50Cal"],
      target: ["Armor.Heavy"],
      attacker: [],
      location: "Infantry.Torso.Middle",
    });
    expect([...applying].filter((index) => index >= 84 && index <= 91)).toEqual([86, 87, 88]);
  });

  it("requires every attacker tag a rule lists", () => {
    const rule = { ...damageFile.rules[25]!, instigator: ["Team.Red"] };
    const hit = { ...hpIntoLevel3UpperChest };
    expect(applyingRuleIndexes([rule], hit).size).toBe(0);
    expect(applyingRuleIndexes([rule], { ...hit, attacker: ["Team.Red.Squad"] }).size).toBe(1);
  });
});

describe("combinedMultipliers", () => {
  it("multiplies the applicable infantry rules: 2 × 0.45 × 0.6 = 0.54", () => {
    const infantry = combinedMultipliers(damageFile.rules, hpIntoLevel3UpperChest).find(
      (entry) => entry.entity === "Infantry",
    );
    expect(infantry?.ruleCount).toBe(3);
    expect(infantry?.multiplier).toBeCloseTo(0.54, 10);
  });

  it("gives each entity its own multiplier", () => {
    const entries = combinedMultipliers(damageFile.rules, hpIntoLevel3UpperChest);
    expect(entries.find((entry) => entry.entity === "Armor")?.multiplier).toBeCloseTo(0.4 * 0.7, 10);
    expect(entries.find((entry) => entry.entity === "Vehicle.Air.Rotary.Havoc")?.multiplier).toBeCloseTo(0.05, 10);
  });
});

describe("isHitDescribed", () => {
  it("is false only when nothing is entered", () => {
    expect(isHitDescribed({ source: [], target: [], attacker: [], location: null })).toBe(false);
    expect(isHitDescribed({ source: [], target: [], attacker: [], location: "Infantry.Head" })).toBe(true);
  });
});
