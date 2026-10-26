import { normalizeId } from "@/core/catalog";
import type { DiffRecord } from "./types";

export type KeyFunction = (records: readonly DiffRecord[]) => string[];

export function normalizeKey(value: string): string {
  return normalizeId(value);
}

export function text(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }
  return typeof value === "string" ? value : JSON.stringify(value);
}

function sortedList(value: unknown): string {
  return Array.isArray(value) ? value.map(text).map(normalizeKey).sort().join(",") : text(value);
}

export function withOccurrences(keys: readonly string[]): string[] {
  const seen = new Map<string, number>();
  return keys.map((key) => {
    const occurrence = (seen.get(key) ?? 0) + 1;
    seen.set(key, occurrence);
    return occurrence === 1 ? key : `${key}#${occurrence}`;
  });
}

export function byFields(...fields: string[]): KeyFunction {
  return (records) =>
    withOccurrences(records.map((record) => normalizeKey(fields.map((field) => text(record[field])).join("|"))));
}

export const byProjectile: KeyFunction = (records) => {
  const counts = new Map<string, number>();
  for (const record of records) {
    const id = normalizeKey(text(record.id));
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return withOccurrences(
    records.map((record) => {
      const id = normalizeKey(text(record.id));
      return (counts.get(id) ?? 0) > 1 ? `${id}|${normalizeKey(text(record.asset))}` : id;
    }),
  );
};

export function damageRuleKey(rule: DiffRecord): string {
  return normalizeKey(
    [
      text(rule.entity),
      text(rule.category),
      text(rule.operation),
      sortedList(rule.source),
      sortedList(rule.target),
      sortedList(rule.instigator),
      sortedList(rule.hitLocations),
      text(rule.alignment),
      text(rule.custom),
    ].join("|"),
  );
}

export const byDamageRule: KeyFunction = (records) => withOccurrences(records.map(damageRuleKey));
