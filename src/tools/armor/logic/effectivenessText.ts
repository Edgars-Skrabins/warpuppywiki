import type { AmmoTypeEffect } from "@/core/data";
import { formatPercent } from "@/ui";

export const ARMS_CLASSES: readonly { key: string; label: string; weapons: string }[] = [
  { key: "Small", label: "Small", weapons: "small-caliber weapons" },
  { key: "Medium", label: "Medium", weapons: "medium-caliber weapons" },
  { key: "High", label: "High", weapons: "high-caliber weapons" },
  { key: "Special", label: "Special", weapons: "special weapons" },
];

export interface EffectivenessRow {
  ammoType: string;
  label: string;
  modifier: number;
  byArmsClass: Readonly<Record<string, number | null>>;
  lines: readonly string[];
}

export function effectivenessSentence(label: string, value: number, against?: string): string {
  const suffix = against === undefined ? "" : ` against ${against}`;
  if (value < 1) {
    return `${label} weakens armor to ${formatPercent(value)} of its reduction${suffix}.`;
  }
  if (value > 1) {
    return `${label} strengthens armor to ${formatPercent(value)} of its reduction${suffix}.`;
  }
  return `${label} leaves armor at its full reduction${suffix}.`;
}

function classValue(effect: AmmoTypeEffect, armsClass: string): number | null {
  const entry = Object.entries(effect.byArmsClass).find(([key]) => key.toLowerCase() === armsClass.toLowerCase());
  return entry?.[1] ?? null;
}

export function effectivenessRows(
  ammoTypes: readonly AmmoTypeEffect[],
  labelOf: (ammoType: string) => string,
): EffectivenessRow[] {
  return ammoTypes.map((effect) => {
    const label = labelOf(effect.ammoType);
    const byArmsClass = Object.fromEntries(
      ARMS_CLASSES.map((armsClass) => [armsClass.key, classValue(effect, armsClass.key)]),
    );
    const classLines = ARMS_CLASSES.flatMap((armsClass) => {
      const value = byArmsClass[armsClass.key];
      return value === null || value === undefined ? [] : [effectivenessSentence(label, value, armsClass.weapons)];
    });
    const lines =
      classLines.length === 0
        ? [effectivenessSentence(label, effect.modifier)]
        : classLines.length < ARMS_CLASSES.length
          ? [...classLines, effectivenessSentence(label, effect.modifier, "other weapons")]
          : classLines;
    return { ammoType: effect.ammoType, label, modifier: effect.modifier, byArmsClass, lines };
  });
}
