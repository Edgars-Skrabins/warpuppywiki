import type { UnlockInfo } from "@/core/catalog";
import type { Modifier, Weapon } from "@/core/data";
import { attributeInfo, type AttributeUnit } from "@/core/modifiers";
import { EMPTY_VALUE, formatDistance, formatMultiplier, formatNumber } from "@/ui";

const SUMMARY_LIMIT = 3;

export function formatUnlock(unlock: UnlockInfo | null): string {
  return unlock === null ? EMPTY_VALUE : `${unlock.roleLabel} ${formatNumber(unlock.level)}`;
}

export function formatList(values: readonly string[]): string {
  return values.length === 0 ? EMPTY_VALUE : values.join(", ");
}

function amountText(value: number, unit: AttributeUnit): string {
  return unit === "meters" ? formatDistance(value) : formatNumber(value);
}

function modifierValue(modifier: Modifier): string {
  const { unit } = attributeInfo(modifier.attribute);
  switch (modifier.op) {
    case "multiply":
    case "multiplyCompound":
      return formatMultiplier(modifier.value);
    case "add":
      return `${modifier.value < 0 ? "−" : "+"}${amountText(Math.abs(modifier.value), unit)}`;
    case "override":
      return `= ${amountText(modifier.value, unit)}`;
  }
}

export function formatModifier(modifier: Modifier): string {
  return `${attributeInfo(modifier.attribute).label} ${modifierValue(modifier)}`;
}

export function formatModifiers(modifiers: readonly Modifier[]): string {
  return modifiers.length === 0 ? "No stat changes" : modifiers.map(formatModifier).join(", ");
}

export function summarizeModifiers(modifiers: readonly Modifier[]): string {
  if (modifiers.length <= SUMMARY_LIMIT) {
    return formatModifiers(modifiers);
  }
  const shown = modifiers.slice(0, SUMMARY_LIMIT).map(formatModifier).join(", ");
  return `${shown}, +${formatNumber(modifiers.length - SUMMARY_LIMIT)} more`;
}

export function formatZeroing(zeroing: Weapon["zeroing"]): string {
  const min = zeroing?.min ?? null;
  const max = zeroing?.max ?? null;
  if (min !== null && max !== null) {
    return `${formatNumber(min)}–${formatDistance(max)}`;
  }
  if (max !== null) {
    return `Up to ${formatDistance(max)}`;
  }
  if (min !== null) {
    return `From ${formatDistance(min)}`;
  }
  return EMPTY_VALUE;
}
