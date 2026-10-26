import type { Item } from "@/core/data";
import { IdMap, sameId } from "./ids";

export interface PriceInfo {
  price: number;
  amount: number;
  unitPrice: number;
  soldWith: string;
  categories: string[];
}

export type VendorIndex = IdMap<PriceInfo>;

export function buildVendorIndex(items: readonly Item[]): VendorIndex {
  const index: VendorIndex = new IdMap();
  for (const item of items) {
    for (const entry of item.vendor) {
      const existing = index.get(entry.tag);
      if (existing !== undefined && (sameId(existing.soldWith, entry.tag) || !sameId(item.id, entry.tag))) {
        continue;
      }
      index.set(entry.tag, {
        price: entry.price,
        amount: entry.amount,
        unitPrice: entry.price / entry.amount,
        soldWith: item.id,
        categories: entry.categories,
      });
    }
  }
  return index;
}

export function priceOf(index: VendorIndex, tag: string): PriceInfo | null {
  return index.get(tag) ?? null;
}
