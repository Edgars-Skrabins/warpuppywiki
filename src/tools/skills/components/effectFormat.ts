import type { AttributeUnit } from "@/core/modifiers";
import { formatDistance, formatMultiplier, formatNumber, formatPercent } from "@/ui";

export function formatEffectValue(value: number, unit: AttributeUnit): string {
  if (unit === "meters") {
    return formatDistance(value);
  }
  if (unit === "points") {
    return formatNumber(value);
  }
  return formatMultiplier(value);
}

export function formatEffectChange(magnitude: number, unit: AttributeUnit): string {
  if (unit === "meters") {
    return formatDistance(magnitude);
  }
  if (unit === "points") {
    return formatNumber(magnitude);
  }
  return formatPercent(magnitude);
}
