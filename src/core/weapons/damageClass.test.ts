import { describe, expect, it } from "vitest";
import { damageClassOf } from "./damageClass";

describe("damageClassOf", () => {
  it.each([
    ["AR", "Weapon.AR"],
    ["SMG", "Weapon.SMG"],
    ["LMG", "Weapon.LMG"],
    ["Shotgun", "Weapon.Shotgun"],
    ["DMR", "Weapon.DMR"],
    ["Sniper", "Weapon.Sniper"],
    ["Pistol", "Weapon.Pistol"],
    ["Bow", "Weapon.CombatBow"],
    ["Launcher", "Weapon.Launcher"],
  ])("maps archetype %s to %s", (archetype, damageClass) => {
    expect(damageClassOf(archetype)).toBe(damageClass);
  });

  it("ignores case", () => {
    expect(damageClassOf("ar")).toBe("Weapon.AR");
  });

  it("falls back to Universal", () => {
    expect(damageClassOf("Melee")).toBe("Universal");
    expect(damageClassOf(null)).toBe("Universal");
  });
});
