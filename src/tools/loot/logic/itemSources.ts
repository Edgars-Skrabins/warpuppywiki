import { normalizeId } from "@/core/catalog";
import type { LootTable } from "@/core/data";
import { entryChances } from "./lootChances";
import { tableLabel } from "./tableLabel";

export interface ItemSource {
  tableId: string;
  itemId: string;
  chance: number;
  asEntry: boolean;
  asExtra: boolean;
}

function tableItemIds(table: LootTable): string[] {
  return table.items.flatMap((entry) => [entry.item, ...entry.subItems.map((sub) => sub.item)]);
}

function sourceInTable(table: LootTable, itemId: string): ItemSource {
  const key = normalizeId(itemId);
  let chance = 0;
  let asEntry = false;
  let asExtra = false;
  for (const entry of entryChances(table)) {
    const extras = entry.extras.filter((extra) => normalizeId(extra.item) === key);
    const isMain = normalizeId(entry.item) === key;
    asEntry ||= isMain;
    asExtra ||= extras.length > 0;
    const inEntry = isMain ? 1 : 1 - extras.reduce((miss, extra) => miss * (1 - extra.chance), 1);
    chance += entry.overallChance * inEntry;
  }
  return { tableId: table.id, itemId, chance, asEntry, asExtra };
}

export function itemSources(tables: readonly LootTable[], matches: (itemId: string) => boolean): ItemSource[] {
  const sources: ItemSource[] = [];
  for (const table of tables) {
    const seen = new Set<string>();
    for (const itemId of tableItemIds(table)) {
      const key = normalizeId(itemId);
      if (seen.has(key) || !matches(itemId)) {
        continue;
      }
      seen.add(key);
      sources.push(sourceInTable(table, itemId));
    }
  }
  return sources.sort((a, b) => b.chance - a.chance);
}

export function tableMatches(table: LootTable, query: string, nameOf: (itemId: string) => string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === "") {
    return true;
  }
  const texts = [table.id, tableLabel(table.id), ...tableItemIds(table).map(nameOf)];
  return texts.some((text) => text.toLowerCase().includes(needle));
}
