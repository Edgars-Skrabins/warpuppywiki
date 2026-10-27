import { sameId } from "@/core/catalog";
import type { DamageFile } from "@/core/data";
import { falloffAt } from "@/core/weapons";
import { coveringPiece, effectiveness, wearStage } from "./armor";
import { hitLocationLabel } from "./hitLocations";
import { armsClassOf, locationTag, sourceTags, targetTags } from "./hitTags";
import { isPlainPercentageRule, ruleFactor, ruleMatches } from "./ruleMatch";
import type { ArmorSlot, HitInput, HitLocation, HitResult, Step } from "./types";

const INFANTRY_ENTITY = "Infantry";
const UNIVERSAL_CLASS = "Universal";
const MODELED_CUSTOM_RULES = ["B_BoneDamageModifiers_C", "B_AmmoTypeEffectiveness_C"];
const ARMOR_ENTITIES: Record<ArmorSlot, string> = { body: "Armor", helmet: "Helmet" };

interface HitTags {
  source: readonly string[];
  target: readonly string[];
  location: string;
}

interface RulePass {
  value: number;
  steps: Step[];
}

export function locationMultiplier(damage: DamageFile, damageClass: string, location: HitLocation): number {
  const own = damage.hitLocationMultipliers.find((entry) => sameId(entry.weaponClass, damageClass));
  const universal = damage.hitLocationMultipliers.find((entry) => sameId(entry.weaponClass, UNIVERSAL_CLASS));
  return (own ?? universal)?.multipliers[location] ?? 1;
}

function signedPercent(amount: number): string {
  return `${amount > 0 ? "+" : ""}${amount}%`;
}

function isModeledCustom(custom: string): boolean {
  return MODELED_CUSTOM_RULES.some((modeled) => sameId(modeled, custom));
}

function applyRules(damage: DamageFile, entity: string, start: number, tags: HitTags, listSkipped: boolean): RulePass {
  const steps: Step[] = [];
  let value = start;
  damage.rules.forEach((rule, ruleIndex) => {
    if (!sameId(rule.entity, entity) || !ruleMatches(rule, tags.source, tags.target, tags.location)) {
      return;
    }
    if (isPlainPercentageRule(rule)) {
      const factor = ruleFactor(rule);
      value *= factor;
      steps.push({
        label: `${rule.category} rule ${signedPercent(rule.amount)}`,
        kind: "rule",
        factor,
        after: value,
        ruleIndex,
      });
    } else if (listSkipped && rule.custom && !rule.alignment && !isModeledCustom(rule.custom)) {
      steps.push({ label: `Not modeled: ${rule.custom}`, kind: "skipped", factor: null, after: value, ruleIndex });
    }
  });
  return { value, steps };
}

export function hitDamage(input: HitInput): HitResult {
  const { damage, weapon, ammo, distance, location, target } = input;
  const projectile = ammo.projectile;
  const base = projectile?.damage ?? 0;
  const falloff = falloffAt(weapon.stats, distance);
  const afterFalloff = base * falloff;
  const multiplier = locationMultiplier(damage, weapon.damageClass, location);
  const afterLocation = afterFalloff * multiplier;
  const steps: Step[] = [
    { label: "Base damage", kind: "base", factor: null, after: base },
    { label: `Falloff at ${distance} m`, kind: "falloff", factor: falloff, after: afterFalloff },
    { label: hitLocationLabel(location), kind: "location", factor: multiplier, after: afterLocation },
  ];
  const tags: HitTags = {
    source: sourceTags(weapon, ammo),
    target: targetTags(target, location),
    location: locationTag(location),
  };
  const infantry = applyRules(damage, INFANTRY_ENTITY, afterLocation, tags, true);
  steps.push(...infantry.steps);
  const covering = coveringPiece(target, location);
  if (covering === null) {
    return { healthDamage: infantry.value, armorDamage: 0, armorPiece: null, steps, armorSteps: [] };
  }
  const { armor, durability } = covering.piece;
  const stage = wearStage(armor, durability);
  const reduction = armor.stages[stage]?.damageReduction ?? 0;
  const ammoEffect = effectiveness(damage, ammo.ammoType, projectile === null ? null : armsClassOf(projectile));
  const applied = Math.min(100, Math.max(0, reduction * ammoEffect));
  const armorFactor = 1 - applied / 100;
  const healthDamage = infantry.value * armorFactor;
  steps.push({
    label: `${armor.name ?? armor.id} stage ${stage + 1}: ${reduction}% × ${ammoEffect}`,
    kind: "armor",
    factor: armorFactor,
    after: healthDamage,
  });
  const wear = applyRules(damage, ARMOR_ENTITIES[covering.slot], afterLocation, tags, false);
  return {
    healthDamage,
    armorDamage: wear.value,
    armorPiece: covering.slot,
    steps,
    armorSteps: [
      { label: "Damage after body part", kind: "location", factor: null, after: afterLocation },
      ...wear.steps,
    ],
  };
}
