import { normalizeId, sameId } from "@/core/catalog";
import type { DamageRule } from "@/core/data";
import { entityGroup, type EntityGroup } from "./entityGroups";

export const RULE_CATEGORIES = [
  "Weapon",
  "Calibre",
  "AmmoModifier",
  "Armor",
  "Bone",
  "Penetration",
  "PenetrationEffectiveness",
  "CaliberEffectiveness",
  "Ricochet",
  "Tracer",
  "Melee",
  "Friendly",
  "None",
] as const;

export interface RuleFilterState {
  group: EntityGroup | null;
  entity: string | null;
  categories: readonly string[];
  source: string;
  nonZero: boolean;
  hideFriendly: boolean;
}

export type RuleSortKey = "file" | "amount" | "entity";

export interface RuleSort {
  key: RuleSortKey;
  descending: boolean;
}

export interface IndexedRule {
  index: number;
  rule: DamageRule;
}

const FRIENDLY_ALIGNMENT = "Friendly";

export function isFriendlyRule(rule: DamageRule): boolean {
  return rule.alignment != null && sameId(rule.alignment, FRIENDLY_ALIGNMENT);
}

export function indexRules(rules: readonly DamageRule[]): IndexedRule[] {
  return rules.map((rule, index) => ({ index, rule }));
}

export function entitiesInGroup(rules: readonly DamageRule[], group: EntityGroup | null): string[] {
  const seen = new Map<string, string>();
  for (const rule of rules) {
    if (group !== null && entityGroup(rule.entity) !== group) continue;
    const key = normalizeId(rule.entity);
    if (!seen.has(key)) seen.set(key, rule.entity);
  }
  return [...seen.values()];
}

function matchesSource(rule: DamageRule, search: string): boolean {
  const needle = search.trim().toLowerCase();
  return needle === "" || rule.source.some((tag) => tag.toLowerCase().includes(needle));
}

export function ruleMatchesFilters(rule: DamageRule, filters: RuleFilterState): boolean {
  if (filters.group !== null && entityGroup(rule.entity) !== filters.group) return false;
  if (filters.entity !== null && !sameId(rule.entity, filters.entity)) return false;
  if (filters.categories.length > 0 && !filters.categories.some((category) => sameId(category, rule.category)))
    return false;
  if (filters.nonZero && rule.amount === 0) return false;
  if (filters.hideFriendly && isFriendlyRule(rule)) return false;
  return matchesSource(rule, filters.source);
}

export function filterRules(rules: readonly IndexedRule[], filters: RuleFilterState): IndexedRule[] {
  return rules.filter(({ rule }) => ruleMatchesFilters(rule, filters));
}

function compare(a: IndexedRule, b: IndexedRule, key: RuleSortKey): number {
  if (key === "amount") return a.rule.amount - b.rule.amount;
  if (key === "entity") return a.rule.entity.localeCompare(b.rule.entity);
  return 0;
}

export function sortRules(rules: readonly IndexedRule[], sort: RuleSort): IndexedRule[] {
  const direction = sort.descending ? -1 : 1;
  return [...rules].sort((a, b) => (compare(a, b, sort.key) || a.index - b.index) * direction);
}
