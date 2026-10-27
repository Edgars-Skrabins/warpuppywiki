import { describe, expect, it } from "vitest";
import type { DamageRule } from "@/core/data";
import { ruleApplies, ruleMatches } from "./ruleMatch";
import { damageFile } from "./testData";

function infantryRule(predicate: (rule: DamageRule) => boolean): DamageRule {
  const rule = damageFile.rules.find((candidate) => candidate.entity === "Infantry" && predicate(candidate));
  if (rule === undefined) {
    throw new Error("No such rule in the fixture");
  }
  return rule;
}

const hpSource = ["Bullet", "Bullet.545mm", "AmmoModifier.HollowPoint", "Arms.Medium", "Weapon.AR", "Weapon.AR.AK47M"];

describe("ruleApplies", () => {
  const hpBonus = infantryRule((rule) => rule.amount === 100);
  const hpVsArmor = infantryRule((rule) => rule.amount === -55);
  const headOnly = infantryRule((rule) => rule.hitLocations.includes("Infantry.Head"));

  it("applies the hollow point bonus to an unarmored torso hit", () => {
    expect(ruleApplies(hpBonus, hpSource, [], "Infantry.Torso.Upper")).toBe(true);
  });

  it("applies hollow point against armor only when the target wears armor there", () => {
    expect(ruleApplies(hpVsArmor, hpSource, [], "Infantry.Torso.Upper")).toBe(false);
    expect(ruleApplies(hpVsArmor, hpSource, ["Helmet.Heavy"], "Infantry.Head")).toBe(false);
    expect(ruleApplies(hpVsArmor, hpSource, ["Armor.Heavy"], "Infantry.Torso.Upper")).toBe(true);
  });

  it("limits a rule to its hit locations", () => {
    const source = ["Bullet", "Bullet.556mm", "Weapon.Sniper", "Weapon.Sniper.WEPN_035"];
    expect(headOnly.hitLocations).toEqual(["Infantry.Neck", "Infantry.Head"]);
    expect(ruleApplies(headOnly, source, [], "Infantry.Head")).toBe(true);
    expect(ruleApplies(headOnly, source, [], "Infantry.Torso.Upper")).toBe(false);
  });

  it("matches a sub-location against a parent location", () => {
    const allButHead = infantryRule((rule) => rule.hitLocations.includes("Infantry.Torso"));
    const source = ["Bullet", "Bullet.556mm", "Weapon.LMG", "Weapon.LMG.M249"];
    expect(ruleApplies(allButHead, source, [], "Infantry.Torso.Upper")).toBe(true);
    expect(ruleApplies(allButHead, source, [], "Infantry.Head")).toBe(false);
  });

  it("rejects friendly-fire and custom rules even when their tags match", () => {
    const friendly = infantryRule((rule) => rule.alignment === "Friendly" && rule.source.includes("Bullet"));
    const custom = infantryRule((rule) => rule.custom === "B_BoneDamageModifiers_C");
    expect(ruleMatches(friendly, hpSource, [], "Infantry.Torso.Upper")).toBe(true);
    expect(ruleApplies(friendly, hpSource, [], "Infantry.Torso.Upper")).toBe(false);
    expect(ruleMatches(custom, hpSource, [], "Infantry.Torso.Upper")).toBe(true);
    expect(ruleApplies(custom, hpSource, [], "Infantry.Torso.Upper")).toBe(false);
  });
});
