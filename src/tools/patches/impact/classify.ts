import { normalizePath } from "../diff/deepDiff";
import { normalizeKey } from "../diff/keys";
import type { FieldChange } from "../diff/types";
import { IMPACT_RULES, ITEM_CATEGORIES, ITEM_RULES_CATEGORY, type ImpactDirection } from "./impactRules";

export type Impact = "buff" | "nerf" | "neutral" | { label: string };

const INFANTRY_RULE = `rule:${normalizeKey("Infantry")}|`;

function isInfantryRule(entityKey: string): boolean {
  return normalizeKey(entityKey).startsWith(INFANTRY_RULE);
}

export function impactRule(categoryId: string, path: string, entityKey = ""): ImpactDirection | null {
  const pattern = normalizePath(path);
  const own = IMPACT_RULES[categoryId]?.[pattern];
  const item = ITEM_CATEGORIES.includes(categoryId) ? IMPACT_RULES[ITEM_RULES_CATEGORY]?.[pattern] : undefined;
  const rule = own ?? item ?? null;
  if (rule === "infantry-damage" && !isInfantryRule(entityKey)) {
    return "neutral";
  }
  return rule;
}

export function classify(categoryId: string, change: FieldChange, entityKey = ""): Impact {
  const rule = impactRule(categoryId, change.path, entityKey);
  const { before, after } = change;
  if (rule === null || rule === "neutral" || change.kind !== "changed") {
    return "neutral";
  }
  if (typeof before !== "number" || typeof after !== "number" || !Number.isFinite(before - after) || before === after) {
    return "neutral";
  }
  const up = after > before;
  if (rule === "infantry-damage") {
    return { label: up ? "More damage to infantry" : "Less damage to infantry" };
  }
  return up === (rule === "higher") ? "buff" : "nerf";
}

export function impactText(impact: Impact): string | null {
  if (typeof impact === "object") {
    return impact.label;
  }
  return impact === "buff" ? "Buff" : impact === "nerf" ? "Nerf" : null;
}
