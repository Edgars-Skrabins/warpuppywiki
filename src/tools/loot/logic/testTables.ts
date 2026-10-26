import type { LootTable } from "@/core/data";
import loot from "../fixtures/loot.json";

export function fixtureTable(id: string): LootTable {
  const table = (loot.tables as LootTable[]).find((candidate) => candidate.id === id);
  if (!table) {
    throw new Error(`No fixture table ${id}`);
  }
  return table;
}

export const fixtureTables = loot.tables as LootTable[];
