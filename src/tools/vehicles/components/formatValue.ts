import {
  EMPTY_VALUE,
  formatCash,
  formatDistance,
  formatMultiplier,
  formatNumber,
  formatPercent,
  formatSeconds,
  formatWeight,
} from "@/ui";
import type { CompareFormat } from "../logic/vehicleCompare";
import type { UnlockInfo } from "@/core/catalog";
import { SPECIAL_RULE, type VulnerabilityRow } from "../logic/vulnerabilities";

function withUnit(value: number, unit: string, maxFractionDigits = 0): string {
  return `${formatNumber(value, { maxFractionDigits })} ${unit}`;
}

export function formatCompareValue(value: number | null, format: CompareFormat): string {
  if (value === null) return EMPTY_VALUE;
  switch (format) {
    case "cash":
      return formatCash(value);
    case "speed":
      return withUnit(value, "km/h");
    case "liters":
      return withUnit(value, "L");
    case "km":
      return formatDistance(value * 1000);
    case "rpm":
      return withUnit(value, "RPM");
    case "torque":
      return formatNumber(value, { maxFractionDigits: 0 });
    case "ms":
      return formatSeconds(value / 1000, { ms: true });
    case "meters":
      return formatDistance(value);
    case "kg":
      return formatWeight(value);
    case "multiplier":
      return formatMultiplier(value);
    case "count":
    case "ratio":
      return formatNumber(value);
  }
}

export function formatSignedPercent(value: number): string {
  return formatPercent(value / 100, { signed: true });
}

export function formatEffect(row: VulnerabilityRow): string {
  if (row.special) return SPECIAL_RULE;
  if (row.kind === "percent") return formatSignedPercent(row.amount);
  return `${row.amount > 0 ? "+" : ""}${formatNumber(row.amount)}`;
}

export function formatUnlock(unlock: UnlockInfo | null): string {
  if (unlock === null) return EMPTY_VALUE;
  return `${unlock.roleLabel} ${unlock.level} · ${formatCash(unlock.cost)}`;
}

export function formatList(values: readonly string[]): string {
  return values.length === 0 ? EMPTY_VALUE : values.join(", ");
}
