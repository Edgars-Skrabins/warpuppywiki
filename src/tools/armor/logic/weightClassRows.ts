import { sameId } from "@/core/catalog";
import type { WeightClass } from "@/core/data";
import { attributeInfo, combine, type BetterWhen } from "@/core/modifiers";
import { humanize, modifierLabel } from "./labels";

export interface WeightColumn {
  attribute: string;
  label: string;
  betterWhen: BetterWhen;
  base: number;
}

const COLUMN_ATTRIBUTES: readonly { attribute: string; base: number }[] = [
  { attribute: "Movement.MaxSpeedMultiplier", base: 1 },
  { attribute: "Movement.JumpVelocityMultiplier", base: 1 },
  { attribute: "Movement.StaminaRegenPerSecondMultiplier", base: 1 },
  { attribute: "Character.AimSwayScaleMultiplier", base: 1 },
  { attribute: "Character.AimSwaySpeedMultiplier", base: 1 },
  { attribute: "Character.AdsTimeMultiplier", base: 1 },
  { attribute: "Movement.LeanTimeMultiplier", base: 1 },
  { attribute: "Character.Weight", base: 0 },
];

export const WEIGHT_COLUMNS: readonly WeightColumn[] = COLUMN_ATTRIBUTES.map(({ attribute, base }) => ({
  attribute,
  base,
  label: modifierLabel(attribute),
  betterWhen: attributeInfo(attribute).betterWhen,
}));

export interface WeightClassRow {
  name: string;
  label: string;
  minKg: number;
  maxKg: number | null;
  values: Readonly<Record<string, number>>;
}

export function weightClassRows(classes: readonly WeightClass[]): WeightClassRow[] {
  const sorted = [...classes].sort((a, b) => a.minWeightKg - b.minWeightKg);
  return sorted.map((weightClass, index) => ({
    name: weightClass.name,
    label: humanize(weightClass.name),
    minKg: weightClass.minWeightKg,
    maxKg: sorted[index + 1]?.minWeightKg ?? null,
    values: Object.fromEntries(
      WEIGHT_COLUMNS.map((column) => [
        column.attribute,
        combine(
          column.base,
          weightClass.modifiers
            .filter((modifier) => sameId(modifier.attribute, column.attribute))
            .map((modifier) => ({ source: weightClass.name, modifier })),
        ).value,
      ]),
    ),
  }));
}

export interface ClassMatch {
  row: WeightClassRow;
  kgToNext: number | null;
}

export function classFor(rows: readonly WeightClassRow[], kg: number): ClassMatch | null {
  const row = rows.findLast((candidate) => candidate.minKg <= kg);
  if (row === undefined) {
    return null;
  }
  return { row, kgToNext: row.maxKg === null ? null : row.maxKg - kg };
}
