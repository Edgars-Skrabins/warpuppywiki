import type { Skill } from "@/core/data";
import { attributeInfo, type AttributeUnit, type BetterWhen } from "@/core/modifiers";
import { triggerLabel } from "./triggerLabels";

export interface EffectLevel {
  level: number;
  value: number;
  change: number | null;
}

export interface EffectRow {
  key: string;
  label: string;
  trigger: string;
  unit: AttributeUnit;
  betterWhen: BetterWhen;
  levels: EffectLevel[];
}

type SkillEffect = Skill["effects"][number];

function changeFrom(base: number | undefined, value: number, unit: AttributeUnit): number | null {
  if (base === undefined) {
    return null;
  }
  if (unit === "multiplier") {
    return base === 0 ? null : value / base - 1;
  }
  return value - base;
}

function effectRow(effect: SkillEffect, index: number): EffectRow {
  const info = effect.attribute == null ? null : attributeInfo(effect.attribute);
  const unit = info?.unit ?? "multiplier";
  const stored = [...(effect.levels ?? [])].sort((a, b) => a.level - b.level);
  const base = stored.find((entry) => entry.level === 0)?.value;
  return {
    key: `${index}-${effect.effect}`,
    label: info?.label ?? effect.effect,
    trigger: triggerLabel(effect.trigger),
    unit,
    betterWhen: info?.betterWhen ?? "neutral",
    levels: stored.map((entry) => ({
      level: entry.level,
      value: entry.value,
      change: changeFrom(base, entry.value, unit),
    })),
  };
}

export function skillEffects(skill: Skill): EffectRow[] {
  return skill.effects.map(effectRow);
}

export function hasEffects(skill: Skill): boolean {
  return skill.effects.length > 0;
}
