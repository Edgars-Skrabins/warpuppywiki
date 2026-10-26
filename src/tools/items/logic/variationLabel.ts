import { normalizeId, sameId } from "@/core/catalog";
import type { Item } from "@/core/data";

const AMMO_WORDS: readonly [RegExp, string][] = [
  [/^ArmorPiercing/i, "AP"],
  [/^HollowPoint/i, "HP"],
  [/^FMJ/i, "FMJ"],
  [/^Tracer/i, "Tracer"],
];

function ammoWords(segment: string): string[] | null {
  const words: string[] = [];
  let rest = segment;
  while (rest.length > 0) {
    const match = AMMO_WORDS.find(([pattern]) => pattern.test(rest));
    if (match === undefined) {
      return null;
    }
    const [pattern, word] = match;
    words.push(word);
    rest = rest.replace(pattern, "");
  }
  return words;
}

function ammoLabel(words: readonly string[]): string {
  const tracer = words.includes("Tracer");
  const types = words.filter((word) => word !== "Tracer");
  if (types.length === 0) {
    return "Tracer";
  }
  return tracer ? `${types.join(" ")} (T)` : types.join(" ");
}

function trailingAmmoWords(segments: readonly string[]): string[] {
  const words: string[] = [];
  for (let index = segments.length - 1; index >= 0; index--) {
    const segmentWords = ammoWords(segments[index] ?? "");
    if (segmentWords === null) {
      break;
    }
    words.unshift(...segmentWords);
  }
  return words;
}

function baseLabel(item: Pick<Item, "name">): string {
  const rounds = /(\d+)\s*RND/i.exec(item.name);
  return rounds ? `${rounds[1]} RND` : "Standard";
}

export function variationLabel(tag: string, item: Pick<Item, "id" | "name">): string {
  if (sameId(tag, item.id)) {
    return baseLabel(item);
  }
  const segments = tag.split(".");
  const words = trailingAmmoWords(segments);
  if (words.length > 0) {
    return ammoLabel(words);
  }
  const itemSegments = new Set(item.id.split(".").map(normalizeId));
  const extra = segments.filter((segment) => !itemSegments.has(normalizeId(segment)));
  return extra.length > 0 ? extra.join(" ") : "Standard";
}
