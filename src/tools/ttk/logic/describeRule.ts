import { IdMap, sameId, stripPrefix, tagMatches } from "@/core/catalog";
import type { DamageRule } from "@/core/data";
import { formatPercent } from "@/ui";

export interface RuleContext {
  tagText: (tag: string) => string | null;
  weapon: { name: string; damageTag: string | null } | null;
}

const AMMO_MODIFIER_TEXT = new IdMap<string>()
  .set("HollowPoint", "Hollow point")
  .set("HollowPoint.Tracer", "Hollow point tracer")
  .set("ArmorPiercing", "Armor piercing")
  .set("ArmorPiercing.Tracer", "Armor piercing tracer")
  .set("Tracer", "Tracer");

const PROTECTION_LEVEL_TEXT = new IdMap<string>()
  .set("Light", "Level 1")
  .set("Medium", "Level 2")
  .set("Heavy", "Level 3")
  .set("SuperHeavy", "Level 4")
  .set("Ghillie", "Ghillie");

const PROTECTION_KINDS = [
  { prefix: "Armor", text: "armor" },
  { prefix: "Helmet", text: "helmet" },
];

function describeSourceTag(tag: string, context: RuleContext): string | null {
  if (sameId(tag, "Bullet")) {
    return null;
  }
  if (tagMatches(tag, "AmmoModifier")) {
    return AMMO_MODIFIER_TEXT.get(stripPrefix(tag, "AmmoModifier")) ?? tag;
  }
  if (tagMatches(tag, "Bullet")) {
    const caliber = stripPrefix(tag, "Bullet");
    return context.tagText(`Item.Caliber.${caliber}`) ?? caliber;
  }
  if (tagMatches(tag, "Weapon") && context.weapon?.damageTag && sameId(tag, context.weapon.damageTag)) {
    return context.weapon.name;
  }
  return tag;
}

function describeTargetTag(tag: string): string {
  for (const kind of PROTECTION_KINDS) {
    if (sameId(tag, kind.prefix)) {
      return `vs ${kind.text}`;
    }
    if (tagMatches(tag, kind.prefix)) {
      const level = stripPrefix(tag, kind.prefix);
      return `vs ${kind.text} ${PROTECTION_LEVEL_TEXT.get(level) ?? level}`;
    }
  }
  return tag;
}

export function describeRuleSubject(rule: DamageRule, context: RuleContext): string {
  const source = rule.source.map((tag) => describeSourceTag(tag, context)).filter((part) => part !== null);
  const head = source.length > 0 ? source.join(" ") : rule.source.length > 0 ? "Bullets" : "All damage";
  const subject = [head, ...rule.target.map(describeTargetTag)];
  return subject.join(" ");
}

export function describeRule(rule: DamageRule, context: RuleContext): string {
  return `${describeRuleSubject(rule, context)}: ${formatPercent(rule.amount / 100, { signed: true })}`;
}
