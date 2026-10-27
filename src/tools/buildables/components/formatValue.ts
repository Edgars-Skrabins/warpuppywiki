import { EMPTY_VALUE, formatNumber, formatPercent } from "@/ui";
import type { Footprint } from "../logic/buildableRows";
import type { RuleRow } from "../logic/buildableRules";

export function formatFootprint(footprint: Footprint | null): string {
  if (footprint === null) return EMPTY_VALUE;
  const { width, depth, height } = footprint;
  return `${formatNumber(width)} × ${formatNumber(depth)} × ${formatNumber(height)} m`;
}

export function formatEffect(row: RuleRow): string {
  if (row.kind === "percent") return formatPercent(row.amount / 100, { signed: true });
  return `${row.amount > 0 ? "+" : ""}${formatNumber(row.amount)} flat`;
}

export function formatList(values: readonly string[]): string {
  return values.length === 0 ? EMPTY_VALUE : values.join(", ");
}
