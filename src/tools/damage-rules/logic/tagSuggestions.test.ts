import { describe, expect, it } from "vitest";
import type { DamageRule } from "@/core/data";
import { damageFile } from "../fixtures/gameData";
import { tagSuggestions } from "./tagSuggestions";

describe("tagSuggestions", () => {
  const suggestions = tagSuggestions(damageFile.rules);

  it("collects each field's tags once, sorted", () => {
    expect(suggestions.target).toEqual([
      "Armor",
      "Armor.Ghillie",
      "Armor.Heavy",
      "Armor.Light",
      "Armor.Medium",
      "Armor.SuperHeavy",
      "Helmet",
      "Helmet.Ghillie",
      "Helmet.Heavy",
      "Helmet.Light",
      "Helmet.SuperHeavy",
    ]);
    expect(suggestions.source).toContain("AmmoModifier.HollowPoint");
    expect(suggestions.source).toContain("Bullet.50Cal");
    expect(new Set(suggestions.source).size).toBe(suggestions.source.length);
    expect(suggestions.location).toContain("Infantry.Torso.Upper");
    expect(suggestions.location).toContain("Vehicle.MainRotor");
    expect(suggestions.attacker).toEqual([]);
  });

  it("treats tags that differ only in case as one", () => {
    const rule: DamageRule = {
      entity: "Infantry",
      source: ["Bullet", "bullet"],
      target: [],
      instigator: ["Team.Red"],
      hitLocations: [],
      category: "None",
      operation: "Percentage_Ongoing",
      amount: 0,
    };
    expect(tagSuggestions([rule]).source).toEqual(["Bullet"]);
    expect(tagSuggestions([rule]).attacker).toEqual(["Team.Red"]);
  });
});
