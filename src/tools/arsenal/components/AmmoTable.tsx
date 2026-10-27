import { AMMO_TYPE_LABELS } from "@/core/weapons";
import { DataTable, formatCash, formatNumber, type Column } from "@/ui";
import { ARMOR_TARGETS, type AmmoRow } from "../logic/weaponDetail";
import { formatUnlock } from "./formatValue";

export interface AmmoTableProps {
  rows: readonly AmmoRow[];
}

const COLUMNS: Column<AmmoRow>[] = [
  { key: "name", header: "Round", value: (row) => row.name, sortable: true },
  { key: "type", header: "Type", value: (row) => AMMO_TYPE_LABELS[row.ammoType], sortable: true },
  { key: "damage", header: "Damage", value: (row) => row.damage, sortable: true, betterWhen: "higher" },
  {
    key: "price",
    header: "Per round",
    value: (row) => row.pricePerRound,
    render: (row) => formatCash(row.pricePerRound),
    sortable: true,
  },
  {
    key: "unlock",
    header: "Unlock",
    value: (row) => row.unlock?.level ?? null,
    render: (row) => formatUnlock(row.unlock),
    align: "start",
    sortable: true,
  },
  ...ARMOR_TARGETS.map((target, index): Column<AmmoRow> => ({
    key: `stk-${target.key}`,
    header: `STK ${target.label}`,
    value: (row) => row.stk[index] ?? null,
    render: (row) => formatNumber(row.stk[index] ?? null),
    sortable: true,
    betterWhen: "lower",
  })),
];

export function AmmoTable({ rows }: AmmoTableProps) {
  return (
    <DataTable
      aria-label="Ammo"
      columns={COLUMNS}
      rows={rows}
      getRowKey={(row) => row.id}
      emptyText="No ammo found for this weapon"
      maxHeight="none"
    />
  );
}
