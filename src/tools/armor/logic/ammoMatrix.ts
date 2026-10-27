import { sameId, stripPrefix, tagsUnder } from "@/core/catalog";
import { effectiveness, simulateKill, type HitLocation } from "@/core/damage";
import type { Armor, DamageFile, Projectile } from "@/core/data";
import type { AmmoOption, PlayerWeapon, WeaponIndex } from "@/core/weapons";
import type { ArmorRow } from "./armorRows";

export const REFERENCE_DISTANCE = 50;
export const REFERENCE_HEALTH = 100;
export const REFERENCE_LOCATION: HitLocation = "Torso.Upper";
export const DEFAULT_REFERENCE_WEAPON = "Id.Item.M4";

const ARMS_PREFIX = "Meta.Damage.Arms";
const BULLET_PREFIX = "Meta.Damage.Bullet";

export interface MatrixColumn {
  key: string;
  label: string;
  armor: Armor | null;
}

export interface MatrixCell {
  column: string;
  stk: number | null;
  reduction: number;
}

export interface MatrixRow {
  key: string;
  label: string;
  ammo: AmmoOption;
  cells: readonly MatrixCell[];
}

export interface AmmoMatrixInput {
  damage: DamageFile;
  weapon: PlayerWeapon;
  ammoOptions: readonly AmmoOption[];
  columns: readonly MatrixColumn[];
}

export function armsClassOf(projectile: Projectile | null): string | null {
  const tag = projectile === null ? undefined : tagsUnder(projectile.damageContext, ARMS_PREFIX)[0];
  return tag === undefined ? null : stripPrefix(tag, ARMS_PREFIX);
}

function isBulletAmmo(ammo: AmmoOption): boolean {
  const projectile = ammo.projectile;
  return (
    projectile !== null &&
    !projectile.explosive &&
    typeof projectile.damageType === "string" &&
    tagsUnder([projectile.damageType], BULLET_PREFIX).length > 0
  );
}

export function bulletAmmo(index: WeaponIndex, weapon: PlayerWeapon): AmmoOption[] {
  return index.ammoOptions(weapon).filter(isBulletAmmo);
}

export function referenceWeapons(index: WeaponIndex): PlayerWeapon[] {
  return index.playerWeapons.filter((weapon) => bulletAmmo(index, weapon).length > 0);
}

export function defaultReferenceWeapon(weapons: readonly PlayerWeapon[]): PlayerWeapon | null {
  return weapons.find((weapon) => sameId(weapon.id, DEFAULT_REFERENCE_WEAPON)) ?? weapons[0] ?? null;
}

export function protectiveArmor(rows: readonly ArmorRow[]): ArmorRow[] {
  return rows
    .filter((row) => row.reduction !== null && row.durability !== null && row.durability > 0)
    .sort((a, b) => (a.reduction ?? 0) - (b.reduction ?? 0) || (a.durability ?? 0) - (b.durability ?? 0));
}

export function matrixColumns(bodyRows: readonly ArmorRow[]): MatrixColumn[] {
  return [
    { key: "none", label: "None", armor: null },
    ...protectiveArmor(bodyRows).map((row) => ({ key: row.id, label: row.name, armor: row.armor })),
  ];
}

export function effectiveReduction(damage: DamageFile, armor: Armor | null, ammo: AmmoOption): number {
  const stage = armor?.stages[0];
  if (stage === undefined) {
    return 0;
  }
  const percent = stage.damageReduction * effectiveness(damage, ammo.ammoType, armsClassOf(ammo.projectile));
  return Math.min(100, Math.max(0, percent)) / 100;
}

export function shotsToKill(
  damage: DamageFile,
  weapon: PlayerWeapon,
  ammo: AmmoOption,
  armor: Armor | null,
): number | null {
  const result = simulateKill({
    damage,
    weapon,
    ammo,
    distance: REFERENCE_DISTANCE,
    pattern: [REFERENCE_LOCATION],
    target: {
      health: REFERENCE_HEALTH,
      body: armor === null ? null : { armor, durability: armor.durability ?? 0 },
      helmet: null,
      extras: [],
    },
  });
  return result.supported ? result.stk : null;
}

export function ammoMatrix({ damage, weapon, ammoOptions, columns }: AmmoMatrixInput): MatrixRow[] {
  return ammoOptions.map((ammo) => ({
    key: ammo.item.id,
    label: ammo.item.name,
    ammo,
    cells: columns.map((column) => ({
      column: column.key,
      stk: shotsToKill(damage, weapon, ammo, column.armor),
      reduction: effectiveReduction(damage, column.armor, ammo),
    })),
  }));
}
