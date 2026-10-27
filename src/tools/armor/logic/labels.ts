import type { Modifier } from "@/core/data";
import { attributeInfo } from "@/core/modifiers";
import { formatMultiplier, formatNumber } from "@/ui";

const LABELS: Readonly<Record<string, string>> = {
  "movement.maxspeedmultiplier": "Top speed",
  "movement.jumpvelocitymultiplier": "Jump",
  "movement.staminaregenpersecondmultiplier": "Stamina regen",
  "character.aimswayscalemultiplier": "Aim sway",
  "character.aimswayspeedmultiplier": "Aim sway speed",
  "character.adstimemultiplier": "ADS time",
  "movement.leantimemultiplier": "Lean time",
  "character.weight": "Weight penalty",
};

export function modifierLabel(attribute: string): string {
  return LABELS[attribute.toLowerCase()] ?? attributeInfo(attribute).label;
}

export function formatSigned(value: number): string {
  return value >= 0 ? `+${formatNumber(value)}` : formatNumber(value);
}

export function modifierText(modifier: Modifier): string {
  const label = modifierLabel(modifier.attribute);
  switch (modifier.op) {
    case "add":
      return `${label} ${formatSigned(modifier.value)}`;
    case "override":
      return `${label} set to ${formatNumber(modifier.value)}`;
    default:
      return `${label} ${formatMultiplier(modifier.value)}`;
  }
}

export function humanize(word: string): string {
  const spaced = word.replace(/(?<=[a-z0-9])(?=[A-Z])/g, " ").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function contextLabel(context: string): string {
  return humanize(context.split(".").at(-1) ?? context);
}
