import { sameId, type UnlockInfo } from "@/core/catalog";
import { HIT_LOCATIONS, type HitLocation } from "@/core/damage";
import type { Armor, Modifier } from "@/core/data";
import { UNIVERSAL_DAMAGE_CLASS, type AmmoTypeKey, type PlayerWeapon } from "@/core/weapons";
import { caliberLabel, shotsToKill, type ArsenalData, type Caliber } from "./weaponRows";

export interface ArmorTarget {
  key: string;
  label: string;
  armorId: string | null;
}

export const ARMOR_TARGETS: readonly ArmorTarget[] = [
  { key: "none", label: "No armor", armorId: null },
  { key: "level2", label: "Level 2", armorId: "Id.Item.MediumArmor" },
  { key: "level4", label: "Level 4", armorId: "Id.Item.SuperHeavyArmor" },
];

export interface AmmoRow {
  id: string;
  name: string;
  icon: string | null;
  ammoType: AmmoTypeKey;
  damage: number | null;
  pricePerRound: number | null;
  unlock: UnlockInfo | null;
  stk: readonly (number | null)[];
}

export interface LoadedRow {
  ammoType: AmmoTypeKey;
  price: number;
}

export interface MagazineRow {
  id: string;
  name: string;
  capacity: number;
  emptyPrice: number | null;
  loaded: readonly LoadedRow[];
}

export interface AttachmentEntry {
  id: string;
  name: string;
  icon: string | null;
  price: number | null;
  isDefault: boolean;
  modifiers: readonly Modifier[];
}

export interface AttachmentSlot {
  slot: string;
  attachments: readonly AttachmentEntry[];
}

export interface BuiltInPart {
  slot: string;
  id: string;
  name: string;
  modifiers: readonly Modifier[];
}

export interface HitMultiplierRow {
  location: HitLocation;
  label: string;
  multiplier: number | null;
}

export interface WeaponDetailModel {
  weapon: PlayerWeapon;
  subtitle: string | null;
  bullets: readonly string[];
  calibers: readonly Caliber[];
  price: number | null;
  unlock: UnlockInfo | null;
  weight: number | null;
  inventorySlots: readonly string[];
  ammo: readonly AmmoRow[];
  magazines: readonly MagazineRow[];
  attachmentSlots: readonly AttachmentSlot[];
  builtIns: readonly BuiltInPart[];
  hitClass: string;
  hitMultipliers: readonly HitMultiplierRow[];
}

const BULLET_MARK = /^\s*[-•*]\s*/;
const SLOT_PREFIX = "Inventory.Slot";

export function descriptionBullets(description: string | null | undefined): string[] {
  return (description ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(BULLET_MARK, "").trim())
    .filter((line) => line !== "");
}

function armorById(data: ArsenalData, id: string | null): Armor | null {
  return id === null ? null : (data.equipment.armor.find((armor) => sameId(armor.id, id)) ?? null);
}

function ammoRows(data: ArsenalData, weapon: PlayerWeapon): AmmoRow[] {
  const targets = ARMOR_TARGETS.map((target) => ({ target, armor: armorById(data, target.armorId) }));
  return data.index.ammoOptions(weapon).map((option) => ({
    id: option.item.id,
    name: option.item.name,
    icon: option.item.icon ?? null,
    ammoType: option.ammoType,
    damage: option.projectile?.damage ?? null,
    pricePerRound: option.price?.unitPrice ?? null,
    unlock: option.unlock,
    stk: targets.map(({ target, armor }) =>
      target.armorId !== null && armor === null ? null : shotsToKill(data.damage, weapon, option, armor),
    ),
  }));
}

function magazineRows(data: ArsenalData, weapon: PlayerWeapon): MagazineRow[] {
  return data.index.magazineOptions(weapon).map((option) => ({
    id: option.attachment.id,
    name: option.item.name,
    capacity: option.capacity,
    emptyPrice: option.empty?.price ?? null,
    loaded: option.loaded.map((entry) => ({ ammoType: entry.ammoType, price: entry.price.price })),
  }));
}

function attachmentName(data: ArsenalData, id: string, fallback: string | null | undefined): string {
  return data.catalog.item(id)?.name ?? fallback ?? id;
}

function attachmentSlots(data: ArsenalData, weapon: PlayerWeapon): AttachmentSlot[] {
  return weapon.visibleSlots.map((slot) => ({
    slot: slot.slot,
    attachments: data.index.slotOptions(weapon, slot.slot).map((attachment) => ({
      id: attachment.id,
      name: attachmentName(data, attachment.id, attachment.name),
      icon: data.catalog.item(attachment.id)?.icon ?? null,
      price: data.catalog.price(attachment.id)?.price ?? null,
      isDefault: slot.default !== null && slot.default !== undefined && sameId(slot.default, attachment.id),
      modifiers: [...attachment.modifiers, ...attachment.characterModifiers],
    })),
  }));
}

function builtIns(data: ArsenalData, weapon: PlayerWeapon): BuiltInPart[] {
  return data.index.hiddenDefaults(weapon).map(({ slot, attachment }) => ({
    slot,
    id: attachment.id,
    name: attachmentName(data, attachment.id, attachment.name),
    modifiers: [...attachment.modifiers, ...attachment.characterModifiers],
  }));
}

function hitMultipliers(data: ArsenalData, weapon: PlayerWeapon): { hitClass: string; rows: HitMultiplierRow[] } {
  const table = data.damage.hitLocationMultipliers;
  const entry =
    table.find((candidate) => sameId(candidate.weaponClass, weapon.damageClass)) ??
    table.find((candidate) => sameId(candidate.weaponClass, UNIVERSAL_DAMAGE_CLASS));
  return {
    hitClass: entry?.weaponClass ?? weapon.damageClass,
    rows: HIT_LOCATIONS.map(({ location, label }) => ({
      location,
      label,
      multiplier: entry?.multipliers[location] ?? null,
    })),
  };
}

export function weaponDetail(data: ArsenalData, weapon: PlayerWeapon): WeaponDetailModel {
  const { item } = weapon;
  const hits = hitMultipliers(data, weapon);
  return {
    weapon,
    subtitle: item.subtitle ?? null,
    bullets: descriptionBullets(item.description),
    calibers: weapon.stats.calibers.map((id) => ({ id, label: caliberLabel(data.catalog, id) })),
    price: weapon.price?.price ?? null,
    unlock: weapon.unlock,
    weight: item.weight ?? null,
    inventorySlots: weapon.inventorySlots.map((slot) => data.catalog.tagText(`${SLOT_PREFIX}.${slot}`) ?? slot),
    ammo: ammoRows(data, weapon),
    magazines: magazineRows(data, weapon),
    attachmentSlots: attachmentSlots(data, weapon),
    builtIns: builtIns(data, weapon),
    hitClass: hits.hitClass,
    hitMultipliers: hits.rows,
  };
}
