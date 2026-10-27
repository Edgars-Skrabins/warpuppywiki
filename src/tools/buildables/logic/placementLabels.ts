import { normalizeId } from "@/core/catalog";

export const PLACEMENT_LABELS: Record<string, string> = {
  WithinFobBounds: "Inside FOB area",
  SafeZone: "Not in safe zones",
  NotInsideEnemyFobBounds: "Not inside enemy FOB area",
  Fob: "FOB",
};

const LABELS_BY_ID = new Map(Object.entries(PLACEMENT_LABELS).map(([rule, label]) => [normalizeId(rule), label]));

export function splitWords(text: string): string {
  const words = text
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[\s._]+/)
    .filter((word) => word !== "");
  return words
    .map((word, index) => {
      if (/^[A-Z\d]{2,}$/.test(word)) return word;
      const lower = word.toLowerCase();
      return index === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    })
    .join(" ");
}

export function placementLabel(rule: string): string {
  return LABELS_BY_ID.get(normalizeId(rule)) ?? splitWords(rule);
}
