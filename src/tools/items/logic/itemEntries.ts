import type { Catalog, NonPlayerReason, PriceInfo, UnlockInfo } from "@/core/catalog";
import type { Item } from "@/core/data";
import { categoryOf, type ItemCategory } from "./itemCategory";
import { searchWords, matchesSearch } from "./itemSearch";

export interface ItemEntry {
  item: Item;
  category: ItemCategory;
  price: PriceInfo | null;
  unlock: UnlockInfo | null;
  nonPlayer: NonPlayerReason | null;
}

export interface ItemFilter {
  query: string;
  category: ItemCategory | "all";
  showNonPlayer: boolean;
}

export const NON_PLAYER_LABELS: Record<NonPlayerReason, string> = {
  developer: "Developer",
  sandbox: "Sandbox",
  "vehicle-part": "Vehicle part",
  listed: "Unused",
};

export function buildEntries(catalog: Catalog): ItemEntry[] {
  return catalog.items
    .map((item) => ({
      item,
      category: categoryOf(item, catalog),
      price: catalog.price(item.id) ?? catalog.variations(item)[0]?.price ?? null,
      unlock: catalog.unlock(item),
      nonPlayer: catalog.nonPlayerReason(item),
    }))
    .sort((a, b) => itemName(a.item).localeCompare(itemName(b.item), "en-US", { numeric: true, sensitivity: "base" }));
}

export function filterEntries(entries: readonly ItemEntry[], filter: ItemFilter): ItemEntry[] {
  const words = searchWords(filter.query);
  return entries.filter(
    (entry) =>
      (filter.showNonPlayer || entry.nonPlayer === null) &&
      (filter.category === "all" || entry.category === filter.category) &&
      matchesSearch(entry.item, words),
  );
}

export function unlockText(unlock: UnlockInfo): string {
  return `${unlock.roleLabel} Lv ${unlock.level}`;
}

export function itemName(item: Item): string {
  return item.name.trim() || item.id;
}

export function unitPriceOf(price: PriceInfo | null): number | null {
  return price !== null && Number.isFinite(price.unitPrice) ? price.unitPrice : null;
}
