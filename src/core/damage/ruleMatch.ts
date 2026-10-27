import { hasTag, tagMatches } from "@/core/catalog";
import type { DamageRule } from "@/core/data";

const PERCENTAGE_OPERATION = "Percentage_Ongoing";

export function ruleMatches(
  rule: DamageRule,
  sourceTags: readonly string[],
  targetTags: readonly string[],
  locationTag: string,
): boolean {
  return (
    rule.source.every((query) => hasTag(sourceTags, query)) &&
    rule.target.every((query) => hasTag(targetTags, query)) &&
    (rule.hitLocations.length === 0 || rule.hitLocations.some((query) => tagMatches(locationTag, query)))
  );
}

export function isPlainPercentageRule(rule: DamageRule): boolean {
  return rule.operation === PERCENTAGE_OPERATION && !rule.custom && !rule.alignment;
}

export function ruleApplies(
  rule: DamageRule,
  sourceTags: readonly string[],
  targetTags: readonly string[],
  locationTag: string,
): boolean {
  return isPlainPercentageRule(rule) && ruleMatches(rule, sourceTags, targetTags, locationTag);
}

export function ruleFactor(rule: DamageRule): number {
  return 1 + rule.amount / 100;
}
