import { hasTag, normalizeId } from "@/core/catalog";
import { ruleApplies, ruleFactor } from "@/core/damage";
import type { DamageRule } from "@/core/data";

export interface HitDescription {
  source: readonly string[];
  target: readonly string[];
  attacker: readonly string[];
  location: string | null;
}

export interface EntityMultiplier {
  entity: string;
  multiplier: number;
  ruleCount: number;
}

export function isHitDescribed(hit: HitDescription): boolean {
  return hit.source.length > 0 || hit.target.length > 0 || hit.attacker.length > 0 || hit.location !== null;
}

export function hitApplies(rule: DamageRule, hit: HitDescription): boolean {
  return (
    rule.instigator.every((query) => hasTag(hit.attacker, query)) &&
    ruleApplies(rule, hit.source, hit.target, hit.location ?? "")
  );
}

export function applyingRuleIndexes(rules: readonly DamageRule[], hit: HitDescription): Set<number> {
  const indexes = new Set<number>();
  rules.forEach((rule, index) => {
    if (hitApplies(rule, hit)) indexes.add(index);
  });
  return indexes;
}

export function combinedMultipliers(rules: readonly DamageRule[], hit: HitDescription): EntityMultiplier[] {
  const byEntity = new Map<string, EntityMultiplier>();
  for (const rule of rules) {
    if (!hitApplies(rule, hit)) continue;
    const key = normalizeId(rule.entity);
    const current = byEntity.get(key) ?? { entity: rule.entity, multiplier: 1, ruleCount: 0 };
    byEntity.set(key, {
      entity: current.entity,
      multiplier: current.multiplier * ruleFactor(rule),
      ruleCount: current.ruleCount + 1,
    });
  }
  return [...byEntity.values()];
}
