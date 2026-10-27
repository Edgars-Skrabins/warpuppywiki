import { sameId, stripPrefix } from "@/core/catalog";
import type { DamageRule } from "@/core/data";
import { splitWords } from "./placementLabels";

export const SOURCE_LABELS: Record<string, string> = {
  Bullet: "Bullets",
  "AmmoModifier.ArmorPiercing": "armor-piercing",
  "AmmoModifier.HollowPoint": "hollow-point",
  Explosive: "Explosives",
  "Explosive.Rocket": "Rockets",
  "Explosive.Grenade": "Grenades",
  "Explosive.Utility": "Utility explosives",
  "Explosive.Utility.C4": "C4",
  "Explosive.Utility.IED": "IEDs",
  "Explosive.Drone": "Drones",
  "Explosive.Radius.Inner": "(direct hit)",
  Cannon: "Cannons",
  "DamageType.Melee": "Melee",
  "Kinetic.Impact.Throwable": "Thrown objects",
  "Kinetic.Impact.ExplosiveBlunt": "Explosive blunt force",
  "Vehicle.Land.Tracked": "Tracked vehicles",
};

const SOURCE_PATTERNS: readonly [RegExp, string][] = [
  [/^explosive\.rocket\.(.+)$/i, "rockets"],
  [/^explosive\.grenade\.(.+)$/i, "grenades"],
  [/^cannon\.(.+)$/i, "cannon"],
  [/^bullet\.(.+)$/i, "bullets"],
];

const MODIFIER_PREFIX = "AmmoModifier";

const SUFFIX_TAGS = ["Explosive.Radius.Inner"];

export type EffectKind = "percent" | "flat";

export interface RuleRow {
  key: string;
  source: string;
  sourceTags: readonly string[];
  amount: number;
  kind: EffectKind;
}

function lookup(tag: string): string | undefined {
  const key = Object.keys(SOURCE_LABELS).find((candidate) => sameId(candidate, tag));
  return key === undefined ? undefined : SOURCE_LABELS[key];
}

function caliberText(caliber: string): string {
  return caliber.replace(/^(\d+(?:x\d+)?)mm$/i, "$1 mm");
}

function lowerFirst(text: string): string {
  return /^[A-Z][a-z]/.test(text) ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

function upperFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function sourceTagLabel(tag: string): string {
  const label = lookup(tag);
  if (label !== undefined) return label;
  for (const [pattern, noun] of SOURCE_PATTERNS) {
    const match = pattern.exec(tag);
    if (match?.[1]) return `${caliberText(match[1])} ${noun}`;
  }
  return splitWords(tag);
}

export function sourceLabel(tags: readonly string[]): string {
  const isModifier = (tag: string) => stripPrefix(tag, MODIFIER_PREFIX) !== tag;
  const isSuffix = (tag: string) => SUFFIX_TAGS.some((suffix) => sameId(suffix, tag));
  const modifiers = tags.filter(isModifier).map(sourceTagLabel);
  const bases = tags.filter((tag) => !isModifier(tag) && !isSuffix(tag)).map(sourceTagLabel);
  const suffixes = tags.filter(isSuffix).map(sourceTagLabel);
  const words = [...modifiers, bases.map(lowerFirst).join(" and "), ...suffixes].filter((word) => word !== "");
  return upperFirst(words.join(" "));
}

export function entityLabel(entity: string): string {
  return splitWords(stripPrefix(entity, "Buildable"));
}

export function isPercentRule(rule: DamageRule): boolean {
  return rule.operation.toLowerCase().startsWith("percentage");
}

export function rulesForEntity(rules: readonly DamageRule[], damageEntity: string | null): DamageRule[] {
  if (damageEntity === null) return [];
  return rules.filter((rule) => sameId(rule.entity, damageEntity));
}

export function ruleRow(rule: DamageRule, index: number): RuleRow {
  return {
    key: `${rule.entity}#${index}`,
    source: sourceLabel(rule.source),
    sourceTags: rule.source,
    amount: rule.amount,
    kind: isPercentRule(rule) ? "percent" : "flat",
  };
}

export function buildableRules(rules: readonly DamageRule[], damageEntity: string | null): RuleRow[] {
  return rulesForEntity(rules, damageEntity)
    .map(ruleRow)
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "percent" ? -1 : 1;
      return b.amount - a.amount;
    });
}
