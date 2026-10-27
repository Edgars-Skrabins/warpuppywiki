export type ImpactDirection = "higher" | "lower" | "neutral" | "infantry-damage";

export type ImpactRules = Readonly<Record<string, Readonly<Record<string, ImpactDirection>>>>;

export const ITEM_RULES_CATEGORY = "items";

export const ITEM_CATEGORIES: readonly string[] = ["weapons", "ammo", "attachments", "armor", "items"];

export const IMPACT_RULES: ImpactRules = {
  weapons: {
    rpm: "higher",
    muzzleVelocity: "higher",
    effectiveRange: "higher",
    "damageFalloff[].multiplier": "higher",
    meleeDamage: "higher",
    roundsPerBurst: "higher",
    adsTime: "lower",
    accuracy: "lower",
    randomDeviation: "lower",
    windupTime: "lower",
    "recoil.viewKickMultiplier": "lower",
    "recoil.afterPatternPitch[]": "lower",
    "recoil.patternResetTime": "neutral",
    suppressionMultiplier: "neutral",
  },
  ammo: {
    damage: "higher",
    "penetration.effectivenessMultiplier": "higher",
    "explosive.radius": "higher",
    "explosive.effectiveRadius": "higher",
    "explosive.minimumDamage": "higher",
  },
  attachments: {
    "magazine.capacity": "higher",
  },
  armor: {
    durability: "higher",
    "stages[].damageReduction": "higher",
    minWeightKg: "higher",
  },
  [ITEM_RULES_CATEGORY]: {
    "vendor[].price": "lower",
    "unlock.cost": "lower",
    "unlock.level": "lower",
  },
  vehicles: {
    maxSpeed: "higher",
    maxFuel: "higher",
    "health.initial": "higher",
    seats: "higher",
    fuelEconomy: "lower",
  },
  damage: {
    amount: "infantry-damage",
  },
};
