import { describe, expect, it } from "vitest";
import { taggedWeapon } from "./testData";
import { weaponDamageTag } from "./weaponTags";

describe("weaponDamageTag", () => {
  it("uses the table for the M1911", () => {
    expect(weaponDamageTag(taggedWeapon("Id.Item.WEPN_026"))).toBe("Weapon.Pistol.M1911");
  });

  it("builds the tag from archetype and item tag for the M4", () => {
    expect(weaponDamageTag(taggedWeapon("Id.Item.M4"))).toBe("Weapon.AR.M4");
  });

  it("uses the table for the PKM", () => {
    expect(weaponDamageTag(taggedWeapon("Id.Item.LMG_02"))).toBe("Weapon.LMG.LMG_02");
  });

  it("matches the table case-insensitively", () => {
    expect(weaponDamageTag({ ...taggedWeapon("Id.Item.AK74M"), id: "id.item.ak74m" })).toBe("Weapon.AR.AK47M");
  });

  it("has no tag for a weapon tagged only Item.Weapon", () => {
    expect(weaponDamageTag(taggedWeapon("Id.Item.WEPN_028"))).toBeNull();
  });
});
