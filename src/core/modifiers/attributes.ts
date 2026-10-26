export type BetterWhen = "lower" | "higher" | "neutral";

export type AttributeUnit = "multiplier" | "meters" | "points";

export interface AttributeInfo {
  label: string;
  betterWhen: BetterWhen;
  unit: AttributeUnit;
}

export const ATTRIBUTES: Readonly<Record<string, AttributeInfo>> = {
  "Weapon.AimTime": { label: "ADS time", betterWhen: "lower", unit: "multiplier" },
  "Weapon.VerticalRecoilMultiplier": { label: "Vertical recoil", betterWhen: "lower", unit: "multiplier" },
  "Weapon.HorizontalRecoilMultiplier": { label: "Horizontal recoil", betterWhen: "lower", unit: "multiplier" },
  "Weapon.SpreadMultiplier": { label: "Spread", betterWhen: "lower", unit: "multiplier" },
  "Weapon.EquipSpeedMultiplier": { label: "Equip speed", betterWhen: "higher", unit: "multiplier" },
  "Weapon.AdsZoomMultiplier": { label: "Zoom", betterWhen: "neutral", unit: "multiplier" },
  "Weapon.MinZeroingRange": { label: "Min zeroing", betterWhen: "neutral", unit: "meters" },
  "Weapon.MaxZeroingRange": { label: "Max zeroing", betterWhen: "neutral", unit: "meters" },
  "Character.AimSwayScaleMultiplier": { label: "Aim sway", betterWhen: "lower", unit: "multiplier" },
  "Character.AimSwaySpeedMultiplier": { label: "Aim sway speed", betterWhen: "lower", unit: "multiplier" },
  "Character.AimSwayHorizontalMovementMultiplier": {
    label: "Sway while moving (horizontal)",
    betterWhen: "lower",
    unit: "multiplier",
  },
  "Character.AimSwayVerticalMovementMultiplier": {
    label: "Sway while moving (vertical)",
    betterWhen: "lower",
    unit: "multiplier",
  },
  "Character.WeaponSway.RotationStabilizationMultiplier": {
    label: "Sway settle (rotation)",
    betterWhen: "higher",
    unit: "multiplier",
  },
  "Character.WeaponSway.TranslationStabilizationMultiplier": {
    label: "Sway settle (position)",
    betterWhen: "higher",
    unit: "multiplier",
  },
  "Character.WeaponSway.StabilizationTimeMultiplier": {
    label: "Sway settle time",
    betterWhen: "lower",
    unit: "multiplier",
  },
  "Character.AdsTimeMultiplier": { label: "ADS time (character)", betterWhen: "lower", unit: "multiplier" },
  "Character.SuppressionReductionMultiplier": { label: "Suppression taken", betterWhen: "lower", unit: "multiplier" },
  "Character.Weight": { label: "Weight penalty", betterWhen: "lower", unit: "points" },
  "Movement.MaxSpeedMultiplier": { label: "Top speed", betterWhen: "higher", unit: "multiplier" },
  "Movement.JumpVelocityMultiplier": { label: "Jump height", betterWhen: "higher", unit: "multiplier" },
  "Movement.StaminaRegenPerSecondMultiplier": { label: "Stamina regen", betterWhen: "higher", unit: "multiplier" },
  "Movement.LeanTimeMultiplier": { label: "Lean time", betterWhen: "lower", unit: "multiplier" },
  "Movement.UnleanTimeMultiplier": { label: "Unlean time", betterWhen: "lower", unit: "multiplier" },
};

const byLowerCase = new Map(Object.entries(ATTRIBUTES).map(([attribute, info]) => [attribute.toLowerCase(), info]));

function fallbackLabel(attribute: string): string {
  const words = attribute
    .split(".")
    .slice(-2)
    .flatMap((part) => part.split(/(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])/))
    .filter((word) => word.length > 0)
    .map((word) => word.toLowerCase());
  const label = words.join(" ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function attributeInfo(attribute: string): AttributeInfo {
  return (
    byLowerCase.get(attribute.toLowerCase()) ?? {
      label: fallbackLabel(attribute),
      betterWhen: "neutral",
      unit: "multiplier",
    }
  );
}
