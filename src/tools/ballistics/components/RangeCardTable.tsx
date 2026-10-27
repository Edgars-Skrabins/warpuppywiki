import { DataTable, formatDistance, formatMultiplier, formatNumber, formatSeconds, type Column } from "@/ui";
import type { RangeCardRow } from "../logic/rangeCard";

export interface RangeCardTableProps {
  rows: readonly RangeCardRow[];
  comparison?: readonly RangeCardRow[];
}

interface PairedRow {
  distance: number;
  primary: RangeCardRow;
  comparison: RangeCardRow | null;
}

function formatDrop(cm: number): string {
  const text = `${formatNumber(Math.abs(cm), { maxFractionDigits: 1 })} cm`;
  return cm < -0.05 ? `−${text}` : cm > 0.05 ? `+${text}` : text;
}

function formatMils(mils: number): string {
  return formatNumber(mils, { maxFractionDigits: 1 });
}

const DISTANCE: Column<PairedRow> = {
  key: "distance",
  header: "Distance",
  value: (row) => row.distance,
  render: (row) => formatDistance(row.distance),
  align: "end",
};

function dropColumn(key: string, header: string, pick: (row: PairedRow) => RangeCardRow | null): Column<PairedRow> {
  return {
    key,
    header,
    value: (row) => pick(row)?.dropCm ?? null,
    render: (row) => {
      const card = pick(row);
      return card ? formatDrop(card.dropCm) : "—";
    },
    align: "end",
  };
}

function timeColumn(key: string, header: string, pick: (row: PairedRow) => RangeCardRow | null): Column<PairedRow> {
  return {
    key,
    header,
    value: (row) => pick(row)?.time ?? null,
    render: (row) => formatSeconds(pick(row)?.time),
    align: "end",
  };
}

const primary = (row: PairedRow) => row.primary;
const second = (row: PairedRow) => row.comparison;

const SINGLE_COLUMNS: readonly Column<PairedRow>[] = [
  DISTANCE,
  dropColumn("drop", "Drop", primary),
  {
    key: "mils",
    header: "Holdover (mil)",
    value: (row) => row.primary.mils,
    render: (row) => formatMils(row.primary.mils),
    align: "end",
  },
  timeColumn("time", "Flight time", primary),
  {
    key: "velocity",
    header: "Velocity",
    value: (row) => row.primary.velocity,
    render: (row) => `${formatNumber(row.primary.velocity, { maxFractionDigits: 0 })} m/s`,
    align: "end",
  },
  {
    key: "energy",
    header: "Energy",
    value: (row) => row.primary.energy,
    render: (row) => `${formatNumber(row.primary.energy, { maxFractionDigits: 0 })} J`,
    align: "end",
  },
  {
    key: "falloff",
    header: "Falloff",
    value: (row) => row.primary.falloff,
    render: (row) => formatMultiplier(row.primary.falloff),
    align: "end",
  },
  {
    key: "damage",
    header: "Damage",
    value: (row) => row.primary.damage,
    render: (row) => formatNumber(row.primary.damage, { maxFractionDigits: 1 }),
    align: "end",
  },
  {
    key: "lead",
    header: "Lead at 5 m/s",
    value: (row) => row.primary.lead,
    render: (row) => formatDistance(row.primary.lead),
    align: "end",
  },
];

const PAIRED_COLUMNS: readonly Column<PairedRow>[] = [
  DISTANCE,
  dropColumn("drop", "Drop A", primary),
  dropColumn("dropComparison", "Drop B", second),
  timeColumn("time", "Flight time A", primary),
  timeColumn("timeComparison", "Flight time B", second),
];

export function RangeCardTable({ rows, comparison }: RangeCardTableProps) {
  const paired: PairedRow[] = rows.map((row) => ({
    distance: row.distance,
    primary: row,
    comparison: comparison?.find((candidate) => candidate.distance === row.distance) ?? null,
  }));
  return (
    <DataTable
      aria-label="Range card"
      columns={comparison ? PAIRED_COLUMNS : SINGLE_COLUMNS}
      rows={paired}
      getRowKey={(row) => String(row.distance)}
      emptyText="The bullet does not reach the first range card distance."
    />
  );
}
