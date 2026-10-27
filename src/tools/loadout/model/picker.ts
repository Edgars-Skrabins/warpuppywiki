import type { Catalog, UnlockInfo } from "@/core/catalog";
import type { Item } from "@/core/data";

export type PickerSort = "name" | "price" | "weight";

export interface PickerOption {
  item: Item;
  price: number | null;
  weight: number | null;
  unlock: UnlockInfo | null;
}

export interface PickerGroup {
  id: string;
  label: string;
  options: PickerOption[];
}

export interface PickerQuery {
  search: string;
  sort: PickerSort;
  groupByArchetype: boolean;
}

function compareNullable(a: number | null, b: number | null): number {
  if (a === null || b === null) {
    return a === b ? 0 : a === null ? 1 : -1;
  }
  return a - b;
}

function compareOptions(sort: PickerSort): (a: PickerOption, b: PickerOption) => number {
  const byName = (a: PickerOption, b: PickerOption) =>
    a.item.name.localeCompare(b.item.name, "en-US", { numeric: true, sensitivity: "base" });
  if (sort === "price") {
    return (a, b) => compareNullable(a.price, b.price) || byName(a, b);
  }
  if (sort === "weight") {
    return (a, b) => compareNullable(a.weight, b.weight) || byName(a, b);
  }
  return byName;
}

function matches(item: Item, needle: string, catalog: Catalog): boolean {
  if (needle === "") {
    return true;
  }
  const text = [item.name, item.subtitle ?? "", catalog.archetype(item)?.label ?? ""].join(" ").toLowerCase();
  return text.includes(needle);
}

export function pickerGroups(items: readonly Item[], catalog: Catalog, query: PickerQuery): PickerGroup[] {
  const needle = query.search.trim().toLowerCase();
  const options = items
    .filter((item) => matches(item, needle, catalog))
    .map((item) => ({
      item,
      price: catalog.price(item.id)?.price ?? null,
      weight: item.weight ?? null,
      unlock: catalog.unlock(item),
    }))
    .sort(compareOptions(query.sort));
  if (!query.groupByArchetype) {
    return options.length === 0 ? [] : [{ id: "all", label: "All", options }];
  }
  const groups: PickerGroup[] = [];
  for (const option of options) {
    const archetype = catalog.archetype(option.item);
    const id = archetype?.id ?? "other";
    const group = groups.find((candidate) => candidate.id === id);
    if (group === undefined) {
      groups.push({ id, label: archetype?.label ?? "Other", options: [option] });
    } else {
      group.options.push(option);
    }
  }
  return groups.sort((a, b) => (a.id === "other" ? 1 : b.id === "other" ? -1 : a.label.localeCompare(b.label)));
}
