import {
  DataTable,
  EMPTY_VALUE,
  formatCash,
  formatDistance,
  formatMultiplier,
  formatNumber,
  formatPercent,
  formatSeconds,
  formatWeight,
  Panel,
  StatDelta,
  type Column,
  type DeltaFormat,
} from "@/ui";
import {
  textDifference,
  type CompareFormat,
  type CompareRow,
  type CompareSectionData,
  type CompareValue,
} from "../compare/compareModel";
import styles from "./Compare.module.css";

const FORMATTERS: Record<Exclude<CompareFormat, "text">, (value: number) => string> = {
  cash: (value) => formatCash(value),
  weight: (value) => formatWeight(value),
  seconds: (value) => formatSeconds(value),
  multiplier: (value) => formatMultiplier(value),
  number: (value) => formatNumber(value),
  percent: (value) => formatPercent(value),
  distance: (value) => formatDistance(value),
};

const DELTA_FORMATS: Record<Exclude<CompareFormat, "text">, DeltaFormat> = {
  cash: "cash",
  weight: "weight",
  seconds: "seconds",
  multiplier: "multiplier",
  number: "number",
  percent: "percent",
  distance: "distance",
};

function valueText(value: CompareValue, format: CompareFormat): string {
  if (format === "text") {
    return value.text ?? EMPTY_VALUE;
  }
  return value.value === null ? EMPTY_VALUE : FORMATTERS[format](value.value);
}

function difference(row: CompareRow) {
  if (row.format === "text") {
    const same = textDifference(row);
    if (same === null) return <span className={styles.muted}>{EMPTY_VALUE}</span>;
    return <span className={styles.muted}>{same === "same" ? "Same" : "Different"}</span>;
  }
  if (row.delta === null) {
    return <span className={styles.muted}>{EMPTY_VALUE}</span>;
  }
  return (
    <StatDelta from={row.a.value} to={row.b.value} betterWhen={row.betterWhen} format={DELTA_FORMATS[row.format]} />
  );
}

const COLUMNS: readonly Column<CompareRow>[] = [
  { key: "label", header: "Stat", value: (row) => row.label },
  { key: "a", header: "A", align: "end", value: (row) => row.a.value, render: (row) => valueText(row.a, row.format) },
  { key: "b", header: "B", align: "end", value: (row) => row.b.value, render: (row) => valueText(row.b, row.format) },
  { key: "difference", header: "B vs A", align: "end", value: (row) => row.delta, render: difference },
];

export interface CompareSectionProps {
  section: CompareSectionData;
}

export function CompareSection({ section }: CompareSectionProps) {
  return (
    <Panel title={section.title} headingLevel={3}>
      <DataTable
        aria-label={section.title}
        columns={COLUMNS}
        rows={section.rows}
        getRowKey={(row) => row.key}
        emptyText="Nothing to compare"
      />
    </Panel>
  );
}
