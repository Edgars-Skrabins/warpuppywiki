import { simulateKill, wearStage } from "@/core/damage";
import type { Armor, DamageFile } from "@/core/data";
import type { AmmoOption, PlayerWeapon } from "@/core/weapons";
import { REFERENCE_DISTANCE, REFERENCE_LOCATION } from "./ammoMatrix";

export const MAX_WEAR_HITS = 40;

export interface WearPoint {
  hit: number;
  durability: number;
  healthDamage: number;
  armorDamage: number;
  stage: number;
}

export interface StageChange {
  hit: number;
  stage: number;
}

export interface WearSeries {
  points: readonly WearPoint[];
  stageChanges: readonly StageChange[];
  spentAt: number | null;
}

export interface WearInput {
  damage: DamageFile;
  weapon: PlayerWeapon;
  ammo: AmmoOption;
  armor: Armor;
}

const EMPTY: WearSeries = { points: [], stageChanges: [], spentAt: null };

export function wearSeries({ damage, weapon, ammo, armor }: WearInput): WearSeries {
  const maxDurability = armor.durability ?? 0;
  if (maxDurability <= 0) {
    return EMPTY;
  }
  const result = simulateKill({
    damage,
    weapon,
    ammo,
    distance: REFERENCE_DISTANCE,
    pattern: [REFERENCE_LOCATION],
    target: {
      health: Number.POSITIVE_INFINITY,
      body: { armor, durability: maxDurability },
      helmet: null,
      extras: [],
    },
  });
  if (!result.supported) {
    return EMPTY;
  }
  const points: WearPoint[] = [];
  const stageChanges: StageChange[] = [];
  let previousStage = wearStage(armor, maxDurability);
  for (const shot of result.shots.slice(0, MAX_WEAR_HITS)) {
    const durability = shot.bodyDurabilityAfter ?? 0;
    const stage = wearStage(armor, durability);
    points.push({
      hit: shot.shot,
      durability,
      healthDamage: shot.hits.reduce((sum, hit) => sum + hit.healthDamage, 0),
      armorDamage: shot.hits.reduce((sum, hit) => sum + hit.armorDamage, 0),
      stage,
    });
    if (durability <= 0) {
      return { points, stageChanges, spentAt: shot.shot };
    }
    if (stage !== previousStage) {
      stageChanges.push({ hit: shot.shot, stage });
      previousStage = stage;
    }
  }
  return { points, stageChanges, spentAt: null };
}
