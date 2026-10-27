import { describe, expect, it } from "vitest";
import { IdMap } from "@/core/catalog";
import { DamageFile } from "@/core/data/schemas/damage";
import damageJson from "@/test/fixtures/data/25937608/damage.json";
import { describeRule, type RuleContext } from "./describeRule";

const rules = DamageFile.parse(damageJson).rules;

const tagTexts = new IdMap<string>().set("Item.Caliber.45ACP", ".45 ACP");

const context: RuleContext = { tagText: (tag) => tagTexts.get(tag) ?? null, weapon: null };

function infantryRule(source: readonly string[], target: readonly string[] = []) {
  const rule = rules.find(
    (candidate) =>
      candidate.entity === "Infantry" &&
      candidate.source.join("+") === source.join("+") &&
      candidate.target.join("+") === target.join("+"),
  );
  if (rule === undefined) {
    throw new Error(`No fixture rule ${source.join("+")} vs ${target.join("+")}`);
  }
  return rule;
}

describe("describeRule", () => {
  it("describes hollow point against an unarmored target", () => {
    expect(describeRule(infantryRule(["Bullet", "AmmoModifier.HollowPoint"]), context)).toBe("Hollow point: +100%");
  });

  it("describes hollow point against armor", () => {
    expect(describeRule(infantryRule(["Bullet", "AmmoModifier.HollowPoint"], ["Armor"]), context)).toBe(
      "Hollow point vs armor: −55%",
    );
  });

  it("describes armor piercing", () => {
    expect(describeRule(infantryRule(["Bullet", "AmmoModifier.ArmorPiercing"]), context)).toBe("Armor piercing: −20%");
  });

  it("names the current weapon in a weapon rule", () => {
    const rule = infantryRule(["Bullet.45ACP", "Weapon.Pistol.M1911"]);
    expect(describeRule(rule, { ...context, weapon: { name: "M1911", damageTag: "Weapon.Pistol.M1911" } })).toBe(
      ".45 ACP M1911: +30%",
    );
    expect(describeRule(rule, context)).toBe(".45 ACP Weapon.Pistol.M1911: +30%");
  });

  it("adds the protection level of a target tag and keeps unknown tags raw", () => {
    expect(describeRule(infantryRule(["Bullet.Arrow"], ["Armor.SuperHeavy"]), context)).toBe(
      "Arrow vs armor Level 4: −34%",
    );
    expect(describeRule(infantryRule(["Explosive"], ["Armor.SuperHeavy"]), context)).toBe(
      "Explosive vs armor Level 4: −50%",
    );
  });
});
