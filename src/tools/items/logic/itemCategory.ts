import { hasTag, tagMatches, type Catalog } from "@/core/catalog";
import type { Item } from "@/core/data";

export type ItemCategory =
  "weapons" | "attachments" | "magazines" | "ammo" | "armor" | "carry" | "utility" | "vehicles" | "other";

export const ITEM_CATEGORIES: readonly { id: ItemCategory; label: string }[] = [
  { id: "weapons", label: "Weapons" },
  { id: "attachments", label: "Attachments" },
  { id: "magazines", label: "Magazines" },
  { id: "ammo", label: "Ammo" },
  { id: "armor", label: "Armor & helmets" },
  { id: "carry", label: "Backpacks & vests" },
  { id: "utility", label: "Utility & medical" },
  { id: "vehicles", label: "Vehicles" },
  { id: "other", label: "Other" },
];

const WEAPON_SLOTS = ["Primary", "Secondary", "Sidearm", "Specialist"];

export function categoryLabel(category: ItemCategory): string {
  return ITEM_CATEGORIES.find((entry) => entry.id === category)?.label ?? category;
}

function isWeapon(item: Item, catalog: Catalog): boolean {
  return (
    catalog.archetype(item) !== null &&
    catalog.slots(item).some((slot) => WEAPON_SLOTS.some((weaponSlot) => tagMatches(slot, weaponSlot)))
  );
}

function soldAsUtility(item: Item): boolean {
  return item.vendor.some((entry) => hasTag(entry.categories, "Vendor.Category.Utility"));
}

export function categoryOf(item: Item, catalog: Catalog): ItemCategory {
  if (isWeapon(item, catalog)) {
    return "weapons";
  }
  if (hasTag(item.tags, "Item.Attachment.Magazine")) {
    return "magazines";
  }
  if (hasTag(item.tags, "Item.Attachment")) {
    return "attachments";
  }
  if (hasTag(item.tags, "Item.Ammo")) {
    return "ammo";
  }
  if (hasTag(item.tags, "Inventory.Slot.Armor") || hasTag(item.tags, "Inventory.Slot.Helmet")) {
    return "armor";
  }
  if (hasTag(item.tags, "Inventory.Slot.Backpack") || hasTag(item.tags, "Inventory.Slot.Vest")) {
    return "carry";
  }
  if (item.kind === "vehicle") {
    return "vehicles";
  }
  if (soldAsUtility(item) || hasTag(item.tags, "Item.Context.QuickSlot")) {
    return "utility";
  }
  return "other";
}
