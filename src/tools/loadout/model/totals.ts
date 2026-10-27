import { sameId, type Catalog, type UnlockInfo } from "@/core/catalog";
import type { EquipmentFile, Item, WeightClass } from "@/core/data";
import {
  attributeInfo,
  collect,
  combine,
  type AttributeInfo,
  type CombineResult,
  type Modifier,
  type ModifierSource,
} from "@/core/modifiers";
import { slotItemId, weaponSetupOf, type Loadout } from "./loadout";
import { SLOT_DEFINITIONS, type SlotDefinition } from "./slots";
import { setupEntries, type SetupEntryKind } from "./weaponSetup";

export type CostSection = "weapons" | "attachments" | "ammo" | "armor" | "gear";

export const COST_SECTIONS: readonly { id: CostSection; label: string }[] = [
  { id: "weapons", label: "Weapons" },
  { id: "attachments", label: "Attachments" },
  { id: "ammo", label: "Ammunition and magazines" },
  { id: "armor", label: "Armor" },
  { id: "gear", label: "Gear" },
];

export interface LoadoutEntry {
  key: string;
  label: string;
  section: CostSection;
  slot: SlotDefinition | null;
  item: Item;
  priceTag: string | null;
  quantity: number;
}

export interface CostLine extends LoadoutEntry {
  unitPrice: number;
  total: number;
  notSold: boolean;
}

export interface CostSummary {
  lines: CostLine[];
  sections: { id: CostSection; label: string; total: number }[];
  notSold: CostLine[];
  total: number;
  budget: number;
  remaining: number;
  overBudgetBy: number;
}

export interface EffectRow {
  attribute: string;
  info: AttributeInfo;
  result: CombineResult;
}

export interface WeightLine extends LoadoutEntry {
  unitKg: number | null;
  totalKg: number;
}

export interface WeightSummary {
  lines: WeightLine[];
  totalKg: number;
  unknownWeight: Item[];
  weightClass: WeightClass | null;
  nextClass: WeightClass | null;
  kgToNext: number | null;
  effects: EffectRow[];
}

export interface ArmorEffects {
  source: string;
  item: Item;
  effects: EffectRow[];
}

export interface UnlockRow {
  item: Item;
  unlock: UnlockInfo;
}

export interface UnlockRoleGroup {
  role: string;
  roleLabel: string;
  highestLevel: number;
  xpRequired: number | null;
  rows: UnlockRow[];
  cost: number;
}

export interface UnlockSummary {
  rows: UnlockRow[];
  roles: UnlockRoleGroup[];
  totalCost: number;
}

const ARMOR_SLOTS = new Set(["armor", "helmet"]);

const SETUP_SECTIONS: Record<SetupEntryKind, CostSection> = {
  attachment: "attachments",
  magazine: "ammo",
  ammo: "ammo",
};

function roundKg(kg: number): number {
  return Math.round(kg * 1000) / 1000;
}

export function loadoutEntries(loadout: Loadout, catalog: Catalog): LoadoutEntry[] {
  const entries: LoadoutEntry[] = [];
  for (const slot of SLOT_DEFINITIONS) {
    const itemId = slotItemId(loadout, slot.id);
    const item = itemId === null ? undefined : catalog.item(itemId);
    if (item !== undefined) {
      entries.push({
        key: slot.id,
        label: slot.label,
        section: slot.kind === "weapon" ? "weapons" : "armor",
        slot,
        item,
        priceTag: item.id,
        quantity: 1,
      });
      const setup = weaponSetupOf(loadout, slot.id);
      for (const entry of setup === null ? [] : setupEntries(setup, catalog, `${slot.id}:`)) {
        entries.push({
          key: entry.key,
          label: entry.item.name,
          section: SETUP_SECTIONS[entry.kind],
          slot: null,
          item: entry.item,
          priceTag: entry.priceTag,
          quantity: entry.quantity,
        });
      }
    }
  }
  for (const gear of loadout.gear) {
    const item = catalog.item(gear.itemId);
    if (item !== undefined) {
      entries.push({
        key: `gear:${item.id}`,
        label: item.name,
        section: "gear",
        slot: null,
        item,
        priceTag: item.id,
        quantity: gear.quantity,
      });
    }
  }
  return entries;
}

export function costSummary(loadout: Loadout, catalog: Catalog): CostSummary {
  const lines = loadoutEntries(loadout, catalog).map((entry): CostLine => {
    const price = entry.priceTag === null ? null : catalog.price(entry.priceTag);
    const unitPrice = price?.price ?? 0;
    return { ...entry, unitPrice, total: unitPrice * entry.quantity, notSold: price === null };
  });
  const total = lines.reduce((sum, line) => sum + line.total, 0);
  const remaining = loadout.budget - total;
  return {
    lines,
    sections: COST_SECTIONS.map((section) => ({
      ...section,
      total: lines.filter((line) => line.section === section.id).reduce((sum, line) => sum + line.total, 0),
    })),
    notSold: lines.filter((line) => line.notSold),
    total,
    budget: loadout.budget,
    remaining,
    overBudgetBy: Math.max(0, -remaining),
  };
}

export function effectRows(label: string, modifiers: readonly Modifier[]): EffectRow[] {
  const sources = [{ label, modifiers }];
  const attributes: string[] = [];
  for (const modifier of modifiers) {
    if (!attributes.some((attribute) => sameId(attribute, modifier.attribute))) {
      attributes.push(modifier.attribute);
    }
  }
  return attributes.map((attribute) => {
    const info = attributeInfo(attribute);
    return { attribute, info, result: combine(info.unit === "multiplier" ? 1 : 0, collect(sources, attribute)) };
  });
}

function sortedClasses(classes: readonly WeightClass[]): WeightClass[] {
  return [...classes].sort((a, b) => a.minWeightKg - b.minWeightKg);
}

export function weightClassFor(kg: number, classes: readonly WeightClass[]): WeightClass | null {
  let found: WeightClass | null = null;
  for (const weightClass of sortedClasses(classes)) {
    if (weightClass.minWeightKg <= kg) {
      found = weightClass;
    }
  }
  return found;
}

export function weightSummary(loadout: Loadout, catalog: Catalog, equipment: EquipmentFile): WeightSummary {
  const lines = loadoutEntries(loadout, catalog).map((entry): WeightLine => {
    const unitKg = entry.item.weight ?? null;
    return { ...entry, unitKg, totalKg: (unitKg ?? 0) * entry.quantity };
  });
  const totalKg = roundKg(lines.reduce((sum, line) => sum + line.totalKg, 0));
  const unknownWeight: Item[] = [];
  for (const line of lines) {
    if (line.unitKg === null && !unknownWeight.some((item) => sameId(item.id, line.item.id))) {
      unknownWeight.push(line.item);
    }
  }
  const weightClass = weightClassFor(totalKg, equipment.weightClasses);
  const nextClass = sortedClasses(equipment.weightClasses).find((candidate) => candidate.minWeightKg > totalKg) ?? null;
  return {
    lines,
    totalKg,
    unknownWeight,
    weightClass,
    nextClass,
    kgToNext: nextClass === null ? null : roundKg(nextClass.minWeightKg - totalKg),
    effects: weightClass === null ? [] : effectRows(`Weight class: ${weightClass.name}`, weightClass.modifiers),
  };
}

interface ArmorSource {
  source: string;
  item: Item;
  modifiers: readonly Modifier[];
}

function armorSources(loadout: Loadout, catalog: Catalog, equipment: EquipmentFile): ArmorSource[] {
  return loadoutEntries(loadout, catalog).flatMap((entry) => {
    if (entry.slot === null || !ARMOR_SLOTS.has(entry.slot.id)) {
      return [];
    }
    const armor = equipment.armor.find((candidate) => sameId(candidate.id, entry.item.id));
    if (armor === undefined || armor.modifiers.length === 0) {
      return [];
    }
    return [{ source: armor.name ?? entry.item.name, item: entry.item, modifiers: armor.modifiers }];
  });
}

export function armorEffects(loadout: Loadout, catalog: Catalog, equipment: EquipmentFile): ArmorEffects[] {
  return armorSources(loadout, catalog, equipment).map(({ source, item, modifiers }) => ({
    source,
    item,
    effects: effectRows(source, modifiers),
  }));
}

export function kitStatSources(loadout: Loadout, catalog: Catalog, equipment: EquipmentFile): ModifierSource[] {
  const sources: ModifierSource[] = armorSources(loadout, catalog, equipment).map(({ source, modifiers }) => ({
    label: source,
    modifiers,
  }));
  const { weightClass } = weightSummary(loadout, catalog, equipment);
  if (weightClass !== null && weightClass.modifiers.length > 0) {
    sources.push({ label: `Weight class: ${weightClass.name}`, modifiers: weightClass.modifiers });
  }
  return sources;
}

export function unlockSummary(loadout: Loadout, catalog: Catalog): UnlockSummary {
  const rows: UnlockRow[] = [];
  for (const entry of loadoutEntries(loadout, catalog)) {
    const unlock = catalog.unlock(entry.item);
    if (unlock !== null && !rows.some((row) => sameId(row.item.id, entry.item.id))) {
      rows.push({ item: entry.item, unlock });
    }
  }
  const roles: UnlockRoleGroup[] = [];
  for (const row of rows) {
    const group = roles.find((candidate) => sameId(candidate.role, row.unlock.role));
    if (group === undefined) {
      roles.push({
        role: row.unlock.role,
        roleLabel: row.unlock.roleLabel,
        highestLevel: row.unlock.level,
        xpRequired: row.unlock.xpRequired,
        rows: [row],
        cost: row.unlock.cost,
      });
    } else {
      group.rows.push(row);
      group.cost += row.unlock.cost;
      if (row.unlock.level > group.highestLevel) {
        group.highestLevel = row.unlock.level;
        group.xpRequired = row.unlock.xpRequired;
      }
    }
  }
  for (const group of roles) {
    group.rows.sort((a, b) => b.unlock.level - a.unlock.level);
  }
  roles.sort((a, b) => a.roleLabel.localeCompare(b.roleLabel));
  return { rows, roles, totalCost: rows.reduce((sum, row) => sum + row.unlock.cost, 0) };
}
