import type { AmmoTypeEffect } from "@/core/data";
import { formatPercent } from "@/ui";

export function ammoTypeLabel(ammoType: string): string {
  return ammoType.replace(/\./g, " ").replace(/([a-z])([A-Z])/g, "$1 $2");
}

function joinList(parts: readonly string[]): string {
  if (parts.length < 2) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

export function effectivenessText(effect: AmmoTypeEffect): string {
  const name = ammoTypeLabel(effect.ammoType);
  const classes = Object.entries(effect.byArmsClass);
  if (effect.modifier === 1 && classes.every(([, value]) => value === 1)) {
    return `${name} leaves armor at its full reduction.`;
  }
  const verb = effect.modifier < 1 ? "weakens" : effect.modifier > 1 ? "strengthens" : "keeps";
  const base = `${name} ${verb} armor to ${formatPercent(effect.modifier)} of its reduction`;
  if (classes.length === 0) return `${base}.`;
  const parts = classes.map(
    ([armsClass, value]) => `${formatPercent(value)} against ${armsClass.toLowerCase()}-caliber weapons`,
  );
  return `${base} by default, ${joinList(parts)}.`;
}
