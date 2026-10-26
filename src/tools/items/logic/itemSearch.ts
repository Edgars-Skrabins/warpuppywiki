import type { Item } from "@/core/data";

export function searchWords(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

function searchText(item: Item): string {
  return [item.name, item.subtitle, item.description, item.id].filter(Boolean).join(" ").toLowerCase();
}

export function matchesSearch(item: Item, words: readonly string[]): boolean {
  if (words.length === 0) {
    return true;
  }
  const text = searchText(item);
  return words.every((word) => text.includes(word));
}

export function searchItems<T extends Item>(items: readonly T[], query: string): T[] {
  const words = searchWords(query);
  return items.filter((item) => matchesSearch(item, words));
}
