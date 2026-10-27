import { useMemo } from "react";
import { formatMultiplier, formatWeight, NumberField, Stack } from "@/ui";
import { formatSigned } from "../logic/labels";
import { classFor, WEIGHT_COLUMNS, type WeightClassRow, type WeightColumn } from "../logic/weightClassRows";
import styles from "./WeightClassTable.module.css";

function quality(column: WeightColumn, value: number): "better" | "worse" | "neutral" {
  if (value === column.base || column.betterWhen === "neutral") return "neutral";
  const higher = value > column.base;
  return higher === (column.betterWhen === "higher") ? "better" : "worse";
}

function ValueCell({ column, value }: { column: WeightColumn; value: number }) {
  const tone = quality(column, value);
  const text = column.base === 0 ? formatSigned(value) : formatMultiplier(value);
  const arrow = value === column.base ? "" : value > column.base ? "▲ " : "▼ ";
  return (
    <td className={styles.number} data-quality={tone}>
      {arrow}
      {text}
    </td>
  );
}

function range(row: WeightClassRow): string {
  return row.maxKg === null
    ? `${formatWeight(row.minKg)} and up`
    : `${formatWeight(row.minKg)} – ${formatWeight(row.maxKg)}`;
}

export interface WeightClassTableProps {
  rows: readonly WeightClassRow[];
  kitKg: number | null;
  onKitKgChange: (kg: number | null) => void;
}

export function WeightClassTable({ rows, kitKg, onKitKgChange }: WeightClassTableProps) {
  const match = useMemo(() => (kitKg === null ? null : classFor(rows, kitKg)), [rows, kitKg]);
  const next = match ? rows[rows.indexOf(match.row) + 1] : undefined;

  return (
    <Stack gap={4}>
      <div className={styles.kit}>
        <NumberField
          label="Your kit weight"
          unit="kg"
          minValue={0}
          step={0.1}
          value={kitKg ?? Number.NaN}
          onChange={(value) => onKitKgChange(Number.isNaN(value) ? null : value)}
          className={styles.field}
        />
        {match !== null && (
          <p className={styles.match} role="status">
            <strong>{match.row.label}</strong>
            {match.kgToNext !== null && next !== undefined
              ? ` · ${formatWeight(match.kgToNext)} until ${next.label}`
              : " · the heaviest class"}
          </p>
        )}
      </div>
      <div className={styles.scroll}>
        <table className={styles.table} aria-label="Weight classes">
          <thead>
            <tr>
              <th scope="col">Class</th>
              <th scope="col">Kit weight</th>
              {WEIGHT_COLUMNS.map((column) => (
                <th key={column.attribute} scope="col" className={styles.number}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.name}
                aria-current={match?.row === row ? "true" : undefined}
                className={match?.row === row ? styles.current : undefined}
              >
                <th scope="row">{row.label}</th>
                <td className={styles.muted}>{range(row)}</td>
                {WEIGHT_COLUMNS.map((column) => (
                  <ValueCell
                    key={column.attribute}
                    column={column}
                    value={row.values[column.attribute] ?? column.base}
                  />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Stack>
  );
}
