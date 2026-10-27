import { DataTable, type Column } from "@/ui";
import type { RuleRow } from "../logic/buildableRules";
import { formatEffect } from "./formatValue";

const columns: Column<RuleRow>[] = [
  { key: "source", header: "Source", value: (row) => row.source, sortable: true },
  {
    key: "effect",
    header: "Effect",
    value: (row) => row.amount,
    render: formatEffect,
    align: "end",
    sortable: true,
  },
];

export interface RulesTableProps {
  label: string;
  rows: readonly RuleRow[];
  emptyText?: string;
}

export function RulesTable({ label, rows, emptyText = "No damage rules for this buildable." }: RulesTableProps) {
  return (
    <DataTable
      aria-label={label}
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.key}
      emptyText={emptyText}
      maxHeight="none"
    />
  );
}
