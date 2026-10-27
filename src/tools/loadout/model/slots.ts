import { sameId, type Catalog } from "@/core/catalog";
import type { Item } from "@/core/data";
import type { SlotId } from "./loadout";

export interface SlotDefinition {
  id: SlotId;
  label: string;
  inventorySlot: string;
  kind: "weapon" | "equipment";
}

export const SLOT_DEFINITIONS: readonly SlotDefinition[] = [
  { id: "primary", label: "Primary", inventorySlot: "Primary", kind: "weapon" },
  { id: "sidearm", label: "Sidearm", inventorySlot: "Sidearm", kind: "weapon" },
  { id: "specialist", label: "Specialist", inventorySlot: "Specialist", kind: "weapon" },
  { id: "armor", label: "Body armor", inventorySlot: "Armor", kind: "equipment" },
  { id: "helmet", label: "Helmet", inventorySlot: "Helmet", kind: "equipment" },
  { id: "vest", label: "Vest", inventorySlot: "Vest", kind: "equipment" },
  { id: "backpack", label: "Backpack", inventorySlot: "Backpack", kind: "equipment" },
];

export function slotDefinition(slot: SlotId): SlotDefinition {
  const definition = SLOT_DEFINITIONS.find((candidate) => candidate.id === slot);
  if (definition === undefined) {
    throw new Error(`Unknown slot ${slot}`);
  }
  return definition;
}

export function fitsSlot(item: Item, slot: SlotDefinition, catalog: Catalog): boolean {
  return catalog.isPlayerItem(item) && catalog.slots(item).some((name) => sameId(name, slot.inventorySlot));
}

export function fitsAnySlot(item: Item, catalog: Catalog): boolean {
  return SLOT_DEFINITIONS.some((slot) => fitsSlot(item, slot, catalog));
}

export function itemsForSlot(slot: SlotDefinition, catalog: Catalog): Item[] {
  return catalog.playerItems.filter((item) => fitsSlot(item, slot, catalog));
}
