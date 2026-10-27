import { normalizeId } from "@/core/catalog";
import type { DamageRule } from "@/core/data";

export interface TagSuggestions {
  source: string[];
  target: string[];
  attacker: string[];
  location: string[];
}

function uniqueSorted(tags: Iterable<string>): string[] {
  const seen = new Map<string, string>();
  for (const tag of tags) {
    const key = normalizeId(tag);
    if (!seen.has(key)) seen.set(key, tag);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));
}

export function tagSuggestions(rules: readonly DamageRule[]): TagSuggestions {
  return {
    source: uniqueSorted(rules.flatMap((rule) => rule.source)),
    target: uniqueSorted(rules.flatMap((rule) => rule.target)),
    attacker: uniqueSorted(rules.flatMap((rule) => rule.instigator)),
    location: uniqueSorted(rules.flatMap((rule) => rule.hitLocations)),
  };
}
