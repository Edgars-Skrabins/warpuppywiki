import { sameId } from "@/core/catalog";
import type { Armor, DamageFile, EquipmentFile } from "@/core/data";
import { DEFAULT_HEALTH, hitPattern, stkByDistance, type DistancePoint, type Target } from "@/core/damage";
import { effectiveStats, type AmmoOption, type PlayerWeapon, type WeaponIndex } from "@/core/weapons";
import {
  ARMOR_LEVELS,
  slotItemId,
  weaponSetupOf,
  type LethalityView,
  type Loadout,
  type SlotId,
  type WeaponSetup,
} from "./loadout";
import { slotDefinition } from "./slots";
import { bareAttachments, fittedAttachments } from "./weaponSetup";

export const LETHALITY_DISTANCES: readonly number[] = [25, 100, 300];
export const LETHALITY_SLOTS: readonly SlotId[] = ["primary", "sidearm", "specialist"];

const LEVEL_PATTERN = /\blevel\s*(\d+)\b/i;

export type ArmorSlotName = "Armor" | "Helmet";

export interface LethalityModel {
  index: WeaponIndex;
  damage: DamageFile;
  equipment: EquipmentFile;
}

export interface WeaponRow {
  slot: SlotId;
  slotLabel: string;
  weapon: PlayerWeapon;
  ammo: AmmoOption;
  assumedAmmo: boolean;
  modeled: boolean;
  magazineId: string | null;
  points: DistancePoint[];
}

export interface ArmorRow {
  distance: number;
  armored: DistancePoint;
  unarmored: DistancePoint;
  extraShots: number | null;
}

export interface ArmorComparison {
  weapon: PlayerWeapon;
  ammo: AmmoOption;
  bodyArmor: Armor | null;
  helmet: Armor | null;
  modeled: boolean;
  rows: ArmorRow[];
}

export function armorLevel(armor: Armor): number | null {
  const match = LEVEL_PATTERN.exec(armor.name ?? "");
  return match === null ? null : Number(match[1]);
}

export function armorForLevel(equipment: EquipmentFile, slot: ArmorSlotName, level: number): Armor | null {
  if (level <= 0) {
    return null;
  }
  return equipment.armor.find((armor) => sameId(armor.slot, slot) && armorLevel(armor) === level) ?? null;
}

export interface ArmorLevelChoice {
  key: string;
  level: number;
  label: string;
}

export function armorLevelChoices(equipment: EquipmentFile, slot: ArmorSlotName): ArmorLevelChoice[] {
  return ARMOR_LEVELS.flatMap((level): ArmorLevelChoice[] => {
    if (level === 0) {
      return [{ key: "0", level, label: "None" }];
    }
    const armor = armorForLevel(equipment, slot, level);
    return armor === null ? [] : [{ key: String(level), level, label: armor.name ?? `Level ${level}` }];
  });
}

export function targetWith(bodyArmor: Armor | null, helmet: Armor | null): Target {
  return {
    health: DEFAULT_HEALTH,
    body: bodyArmor === null ? null : { armor: bodyArmor, durability: bodyArmor.durability ?? 0 },
    helmet: helmet === null ? null : { armor: helmet, durability: helmet.durability ?? 0 },
    extras: [],
  };
}

export function isModeled(ammo: AmmoOption): boolean {
  return ammo.projectile !== null && !ammo.projectile.explosive;
}

export function bulletWeapons(index: WeaponIndex): PlayerWeapon[] {
  return index.playerWeapons.filter((weapon) => index.ammoOptions(weapon).some(isModeled));
}

export function preferredAmmoOf(options: readonly AmmoOption[]): AmmoOption | null {
  return options.find((option) => option.ammoType === "FMJ") ?? options[0] ?? null;
}

export function loadoutAmmo(
  setup: WeaponSetup,
  options: readonly AmmoOption[],
): { ammo: AmmoOption; assumed: boolean } | null {
  const { magazine, looseAmmo } = setup;
  if (magazine !== null && magazine.count > 0) {
    const loaded = options.find((option) => sameId(option.ammoType, magazine.ammoType));
    if (loaded !== undefined) {
      return { ammo: loaded, assumed: false };
    }
  }
  if (looseAmmo !== null && looseAmmo.rounds > 0) {
    const loose = options.find((option) => sameId(option.item.id, looseAmmo.itemId));
    if (loose !== undefined) {
      return { ammo: loose, assumed: false };
    }
  }
  const fallback = preferredAmmoOf(options);
  return fallback === null ? null : { ammo: fallback, assumed: true };
}

export function weaponRow(
  slot: SlotId,
  setup: WeaponSetup,
  model: LethalityModel,
  target: Target,
  placement: LethalityView["placement"],
): WeaponRow | null {
  const weapon = model.index.weapon(setup.itemId);
  if (weapon === undefined) {
    return null;
  }
  const choice = loadoutAmmo(setup, model.index.ammoOptions(weapon));
  if (choice === null) {
    return null;
  }
  const modeled = isModeled(choice.ammo);
  const capacity = effectiveStats(weapon.stats, fittedAttachments(weapon, setup, model.index)).magazineCapacity;
  return {
    slot,
    slotLabel: slotDefinition(slot).label,
    weapon,
    ammo: choice.ammo,
    assumedAmmo: choice.assumed,
    modeled,
    magazineId: setup.magazine?.id ?? null,
    points: modeled
      ? stkByDistance(
          {
            damage: model.damage,
            weapon,
            ammo: choice.ammo,
            distance: LETHALITY_DISTANCES[0] ?? 0,
            pattern: hitPattern(placement).locations,
            target,
            magazineCapacity: capacity,
          },
          LETHALITY_DISTANCES,
        )
      : [],
  };
}

export function lethalityTarget(model: LethalityModel, bodyLevel: number, helmetLevel: number): Target {
  return targetWith(
    armorForLevel(model.equipment, "Armor", bodyLevel),
    armorForLevel(model.equipment, "Helmet", helmetLevel),
  );
}

export function weaponRows(loadout: Loadout, model: LethalityModel): WeaponRow[] {
  const view = loadout.view.lethality;
  const target = lethalityTarget(model, view.targetArmor, view.targetHelmet);
  return LETHALITY_SLOTS.flatMap((slot) => {
    const setup = weaponSetupOf(loadout, slot);
    const row = setup === null ? null : weaponRow(slot, setup, model, target, view.placement);
    return row === null ? [] : [row];
  });
}

function armorById(equipment: EquipmentFile, itemId: string | null): Armor | null {
  return itemId === null ? null : (equipment.armor.find((armor) => sameId(armor.id, itemId)) ?? null);
}

export function threatAmmo(weapon: PlayerWeapon, index: WeaponIndex, ammoType: string | null): AmmoOption | null {
  const options = index.ammoOptions(weapon).filter(isModeled);
  return (
    (ammoType === null ? undefined : options.find((option) => sameId(option.ammoType, ammoType))) ??
    preferredAmmoOf(options)
  );
}

export interface ArmorThreat {
  armorId: string | null;
  helmetId: string | null;
  weaponId: string;
  ammoType: string | null;
  placement: LethalityView["threatPlacement"];
}

export function armorRows(loadout: Loadout, model: LethalityModel): ArmorComparison | null {
  const view = loadout.view.lethality;
  return armorComparison(model, {
    armorId: slotItemId(loadout, "armor"),
    helmetId: slotItemId(loadout, "helmet"),
    weaponId: view.threatWeaponId,
    ammoType: view.threatAmmoType,
    placement: view.threatPlacement,
  });
}

export function armorComparison(model: LethalityModel, threat: ArmorThreat): ArmorComparison | null {
  const weapon = model.index.weapon(threat.weaponId) ?? bulletWeapons(model.index)[0];
  if (weapon === undefined) {
    return null;
  }
  const ammo = threatAmmo(weapon, model.index, threat.ammoType);
  if (ammo === null) {
    return null;
  }
  const bodyArmor = armorById(model.equipment, threat.armorId);
  const helmet = armorById(model.equipment, threat.helmetId);
  const scenario = {
    damage: model.damage,
    weapon,
    ammo,
    distance: LETHALITY_DISTANCES[0] ?? 0,
    pattern: hitPattern(threat.placement).locations,
    magazineCapacity: effectiveStats(weapon.stats, bareAttachments(weapon, model.index)).magazineCapacity,
  };
  const armored = stkByDistance({ ...scenario, target: targetWith(bodyArmor, helmet) }, LETHALITY_DISTANCES);
  const unarmored = stkByDistance({ ...scenario, target: targetWith(null, null) }, LETHALITY_DISTANCES);
  return {
    weapon,
    ammo,
    bodyArmor,
    helmet,
    modeled: isModeled(ammo),
    rows: LETHALITY_DISTANCES.map((distance, position) => {
      const withArmor = armored[position] ?? { distance, stk: null, ttk: null, needsReload: false };
      const without = unarmored[position] ?? { distance, stk: null, ttk: null, needsReload: false };
      return {
        distance,
        armored: withArmor,
        unarmored: without,
        extraShots: withArmor.stk === null || without.stk === null ? null : withArmor.stk - without.stk,
      };
    }),
  };
}
