import { describe, expect, it } from "vitest";
import { ATTRIBUTES, attributeInfo } from "./attributes";

const ATTACHMENT_AND_EQUIPMENT_ATTRIBUTES = [
  "Weapon.AimTime",
  "Weapon.VerticalRecoilMultiplier",
  "Weapon.HorizontalRecoilMultiplier",
  "Weapon.SpreadMultiplier",
  "Weapon.EquipSpeedMultiplier",
  "Weapon.AdsZoomMultiplier",
  "Weapon.MinZeroingRange",
  "Weapon.MaxZeroingRange",
  "Character.AimSwayScaleMultiplier",
  "Character.AimSwaySpeedMultiplier",
  "Character.AimSwayHorizontalMovementMultiplier",
  "Character.AimSwayVerticalMovementMultiplier",
  "Character.WeaponSway.RotationStabilizationMultiplier",
  "Character.WeaponSway.TranslationStabilizationMultiplier",
  "Character.WeaponSway.StabilizationTimeMultiplier",
  "Character.AdsTimeMultiplier",
  "Character.SuppressionReductionMultiplier",
  "Character.Weight",
  "Movement.MaxSpeedMultiplier",
  "Movement.JumpVelocityMultiplier",
  "Movement.StaminaRegenPerSecondMultiplier",
  "Movement.LeanTimeMultiplier",
  "Movement.UnleanTimeMultiplier",
];

describe("attributeInfo", () => {
  it("has a table entry for every attachment and equipment attribute", () => {
    expect(ATTACHMENT_AND_EQUIPMENT_ATTRIBUTES).toHaveLength(23);
    for (const attribute of ATTACHMENT_AND_EQUIPMENT_ATTRIBUTES) {
      expect(ATTRIBUTES[attribute], attribute).toBeDefined();
    }
  });

  it("looks attributes up case-insensitively", () => {
    expect(attributeInfo("weapon.aimtime")).toEqual({ label: "ADS time", betterWhen: "lower", unit: "multiplier" });
  });

  it("gives unknown attributes a readable neutral fallback", () => {
    expect(attributeInfo("Foo.BarBazMultiplier")).toEqual({
      label: "Foo bar baz multiplier",
      betterWhen: "neutral",
      unit: "multiplier",
    });
    expect(attributeInfo("Character.WeaponSway.NewThing").label).toBe("Weapon sway new thing");
  });
});
