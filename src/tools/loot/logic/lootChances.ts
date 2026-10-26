import type { LootTable } from "@/core/data";
import { formatNumber, formatPercent } from "@/ui/format";

export interface LootExtra {
  item: string;
  amount: number;
  chance: number;
}

export interface LootEntryChance {
  item: string;
  amount: number;
  weight: number;
  entryChance: number;
  overallChance: number;
  extras: LootExtra[];
}

function fraction(percent: number): number {
  return Number.isFinite(percent) ? Math.min(Math.max(percent / 100, 0), 1) : 0;
}

function positiveWeight(weight: number): number {
  return Number.isFinite(weight) && weight > 0 ? weight : 0;
}

export function tableSpawnChance(table: LootTable): number {
  return fraction(table.spawnChance);
}

export function entryChances(table: LootTable): LootEntryChance[] {
  const totalWeight = table.items.reduce((sum, entry) => sum + positiveWeight(entry.weight), 0);
  const spawnChance = tableSpawnChance(table);
  return table.items.map((entry) => {
    const entryChance = totalWeight > 0 ? positiveWeight(entry.weight) / totalWeight : 0;
    return {
      item: entry.item,
      amount: entry.amount,
      weight: entry.weight,
      entryChance,
      overallChance: spawnChance * entryChance,
      extras: entry.subItems.map((sub) => ({ item: sub.item, amount: sub.amount, chance: fraction(sub.chance) })),
    };
  });
}

export function formatChance(fraction: number): string {
  return formatPercent(fraction < 0.1 ? fraction : Math.round(fraction * 100) / 100);
}

export function extraText(extra: LootExtra, name: string): string {
  return `${formatNumber(extra.amount)} × ${name}, ${extra.chance >= 1 ? "always" : formatChance(extra.chance)}`;
}
