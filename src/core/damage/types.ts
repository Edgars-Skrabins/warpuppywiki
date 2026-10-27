import type { Armor, DamageFile } from "@/core/data";
import type { AmmoOption, PlayerWeapon } from "@/core/weapons";

export type HitLocation =
  | "Head"
  | "Neck"
  | "Torso.Upper"
  | "Torso.Middle"
  | "Torso.Lower"
  | "Pelvis"
  | "Arm.Upper"
  | "Arm.Lower"
  | "Arm.Hand"
  | "Leg.Thigh"
  | "Leg.Calf"
  | "Leg.Foot";

export type ArmorItem = Armor;

export interface WornPiece {
  armor: ArmorItem;
  durability: number;
}

export interface Target {
  health: number;
  body: WornPiece | null;
  helmet: WornPiece | null;
  extras: readonly ArmorItem[];
}

export interface Scenario {
  damage: DamageFile;
  weapon: PlayerWeapon;
  ammo: AmmoOption;
  distance: number;
  pattern: readonly HitLocation[];
  target: Target;
  pelletsPerShot?: number;
  magazineCapacity?: number | null;
}

export interface HitInput {
  damage: DamageFile;
  weapon: PlayerWeapon;
  ammo: AmmoOption;
  distance: number;
  location: HitLocation;
  target: Target;
}

export type StepKind = "base" | "falloff" | "location" | "rule" | "armor" | "skipped";

export interface Step {
  label: string;
  kind: StepKind;
  factor: number | null;
  after: number;
  ruleIndex?: number;
}

export type ArmorSlot = "body" | "helmet";

export interface HitResult {
  healthDamage: number;
  armorDamage: number;
  armorPiece: ArmorSlot | null;
  steps: Step[];
  armorSteps: Step[];
}

export interface ShotResult {
  shot: number;
  location: HitLocation;
  hits: HitResult[];
  healthAfter: number;
  bodyDurabilityAfter: number | null;
  helmetDurabilityAfter: number | null;
}

export type KillResult =
  | { supported: false; reason: "explosive" | "no-projectile" }
  | {
      supported: true;
      killed: boolean;
      stk: number | null;
      ttk: number | null;
      needsReload: boolean;
      shots: ShotResult[];
    };

export interface DistancePoint {
  distance: number;
  stk: number | null;
  ttk: number | null;
  needsReload: boolean;
}
