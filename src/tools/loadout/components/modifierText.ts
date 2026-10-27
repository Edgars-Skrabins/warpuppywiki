import type { Attachment } from "@/core/data";
import { attributeInfo, type Modifier } from "@/core/modifiers";
import { formatDistance, formatMultiplier, formatNumber } from "@/ui";

const SHORT_LABELS: Record<string, string> = {
  "weapon.aimtime": "ADS",
  "weapon.adszoommultiplier": "Zoom",
};

function modifierText(modifier: Modifier): string {
  const info = attributeInfo(modifier.attribute);
  const label = SHORT_LABELS[modifier.attribute.toLowerCase()] ?? info.label;
  if (info.unit === "meters") {
    return `${label} ${formatDistance(modifier.value)}`;
  }
  if (modifier.op === "add" || info.unit === "points") {
    return `${label} ${modifier.value >= 0 ? "+" : ""}${formatNumber(modifier.value)}`;
  }
  if (modifier.op === "override") {
    return `${label} ${formatNumber(modifier.value)}×`;
  }
  return `${label} ${formatMultiplier(modifier.value)}`;
}

export function modifierSummary(attachment: Attachment): string {
  return [...attachment.modifiers, ...attachment.characterModifiers].map(modifierText).join(", ");
}
