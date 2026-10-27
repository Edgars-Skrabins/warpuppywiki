import { sameId, type Catalog, type UnlockInfo } from "@/core/catalog";
import { DEFAULT_HEALTH, hitPattern, simulateKill, type WornPiece } from "@/core/damage";
import type { Armor, DamageFile, EquipmentFile } from "@/core/data";
import type { AmmoOption, PlayerWeapon, WeaponIndex } from "@/core/weapons";
import { ARCHETYPE_FILTERS, type ArsenalFilters } from "../state";

export interface ArsenalData {
  catalog: Catalog;
  index: WeaponIndex;
  damage: DamageFile;
  equipment: EquipmentFile;
}

export interface Caliber {
  id: string;
  label: string;
}

export interface WeaponRow {
  id: string;
  name: string;
  icon: string | null;
  weapon: PlayerWeapon;
  archetypeId: string | null;
  archetypeLabel: string | null;
  calibers: readonly Caliber[];
  damage: number | null;
  rpm: number | null;
  dps: number | null;
  muzzleVelocity: number | null;
  effectiveRange: number | null;
  fullDamageRange: number | null;
  adsTime: number | null;
  stk: number | null;
  price: number | null;
  unlock: UnlockInfo | null;
}

export const STK_DISTANCE = 50;

const CALIBER_PREFIX = "Item.Caliber";

export function caliberLabel(catalog: Catalog, caliber: string): string {
  return catalog.tagText(`${CALIBER_PREFIX}.${caliber}`) ?? caliber;
}

function archetypeLabel(weapon: PlayerWeapon): string | null {
  const { archetype } = weapon;
  if (archetype === null) {
    return null;
  }
  return ARCHETYPE_FILTERS.find((option) => sameId(option.id, archetype.id))?.label ?? archetype.label;
}

export function primaryAmmo(options: readonly AmmoOption[]): AmmoOption | null {
  const withProjectile = options.filter((option) => option.projectile !== null);
  return withProjectile.find((option) => option.ammoType === "FMJ") ?? withProjectile[0] ?? null;
}

export function fullDamageRange(weapon: PlayerWeapon): number | null {
  const full = (weapon.stats.damageFalloff ?? []).filter((point) => point.multiplier === 1);
  return full.at(-1)?.distance ?? null;
}

export function rawDps(damage: number | null, rpm: number | null): number | null {
  return damage === null || rpm === null ? null : (damage * rpm) / 60;
}

function wornPiece(armor: Armor | null): WornPiece | null {
  return armor !== null && armor.coveredLocations.length > 0 ? { armor, durability: armor.durability ?? 0 } : null;
}

export function shotsToKill(
  damage: DamageFile,
  weapon: PlayerWeapon,
  ammo: AmmoOption | null,
  bodyArmor: Armor | null,
): number | null {
  if (ammo === null) {
    return null;
  }
  const result = simulateKill({
    damage,
    weapon,
    ammo,
    distance: STK_DISTANCE,
    pattern: hitPattern("upper-chest").locations,
    target: { health: DEFAULT_HEALTH, body: wornPiece(bodyArmor), helmet: null, extras: [] },
  });
  return result.supported ? result.stk : null;
}

export function weaponRow(data: ArsenalData, weapon: PlayerWeapon): WeaponRow {
  const { stats } = weapon;
  const ammo = primaryAmmo(data.index.ammoOptions(weapon));
  const damage = ammo?.projectile?.damage ?? null;
  const rpm = stats.rpm ?? null;
  return {
    id: weapon.id,
    name: weapon.name,
    icon: weapon.item.icon ?? null,
    weapon,
    archetypeId: weapon.archetype?.id ?? null,
    archetypeLabel: archetypeLabel(weapon),
    calibers: stats.calibers.map((id) => ({ id, label: caliberLabel(data.catalog, id) })),
    damage,
    rpm,
    dps: rawDps(damage, rpm),
    muzzleVelocity: stats.muzzleVelocity ?? null,
    effectiveRange: stats.effectiveRange ?? null,
    fullDamageRange: fullDamageRange(weapon),
    adsTime: stats.adsTime ?? null,
    stk: shotsToKill(data.damage, weapon, ammo, null),
    price: weapon.price?.price ?? null,
    unlock: weapon.unlock,
  };
}

function archetypeRank(row: WeaponRow): number {
  const index = ARCHETYPE_FILTERS.findIndex((option) => row.archetypeId !== null && sameId(option.id, row.archetypeId));
  return index === -1 ? ARCHETYPE_FILTERS.length : index;
}

export function weaponRows(data: ArsenalData): WeaponRow[] {
  return data.index.playerWeapons
    .map((weapon) => weaponRow(data, weapon))
    .sort(
      (a, b) =>
        archetypeRank(a) - archetypeRank(b) ||
        a.name.localeCompare(b.name, "en-US", { numeric: true, sensitivity: "base" }),
    );
}

function matchesQuery(row: WeaponRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === "") {
    return true;
  }
  return [row.name, ...row.calibers.flatMap((caliber) => [caliber.id, caliber.label])].some((text) =>
    text.toLowerCase().includes(needle),
  );
}

export function filterRows(rows: readonly WeaponRow[], filters: ArsenalFilters): WeaponRow[] {
  return rows.filter(
    (row) =>
      (filters.archetypes.length === 0 ||
        filters.archetypes.some((id) => row.archetypeId !== null && sameId(id, row.archetypeId))) &&
      (filters.slots.length === 0 ||
        filters.slots.some((slot) => row.weapon.inventorySlots.some((entry) => sameId(entry, slot)))) &&
      matchesQuery(row, filters.query),
  );
}
