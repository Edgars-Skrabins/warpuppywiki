import { DataTable, formatMultiplier, type Column } from "@/ui";
import type { HitMultiplierRow } from "../logic/weaponDetail";

export interface HitMultipliersProps {
  rows: readonly HitMultiplierRow[];
}

const COLUMNS: Column<HitMultiplierRow>[] = [
  { key: "location", header: "Body part", value: (row) => row.label },
  {
    key: "multiplier",
    header: "Damage",
    value: (row) => row.multiplier,
    render: (row) => formatMultiplier(row.multiplier),
    betterWhen: "higher",
  },
];

export function HitMultipliers({ rows }: HitMultipliersProps) {
  return (
    <DataTable
      aria-label="Hit-location multipliers"
      columns={COLUMNS}
      rows={rows}
      getRowKey={(row) => row.location}
      emptyText="No hit-location multipliers"
      maxHeight="none"
    />
  );
}
