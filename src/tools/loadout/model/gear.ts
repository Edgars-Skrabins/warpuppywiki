import { hasTag, tagMatches, type Catalog } from "@/core/catalog";
import type { Item } from "@/core/data";
import { fitsAnySlot } from "./slots";

const QUICK_SLOT_TAG = "Item.Context.QuickSlot";
const UTILITY_CATEGORY = "Vendor.Category.Utility";

function isUtility(item: Item): boolean {
  return item.vendor.some((entry) => entry.categories.some((category) => tagMatches(category, UTILITY_CATEGORY)));
}

export function isGearItem(item: Item, catalog: Catalog): boolean {
  return (
    catalog.isPlayerItem(item) && (hasTag(item.tags, QUICK_SLOT_TAG) || isUtility(item)) && !fitsAnySlot(item, catalog)
  );
}

export function gearItems(catalog: Catalog): Item[] {
  return catalog.playerItems.filter((item) => isGearItem(item, catalog));
}
