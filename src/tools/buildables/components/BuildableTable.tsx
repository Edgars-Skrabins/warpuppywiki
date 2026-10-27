import { DataTable, formatMultiplier, formatNumber, ItemIcon, type Column } from "@/ui";
import type { BuildableRow } from "../logic/buildableRows";
import { formatFootprint, formatList } from "./formatValue";
import styles from "./BuildableTable.module.css";

const columns: Column<BuildableRow>[] = [
  {
    key: "name",
    header: "Buildable",
    value: (row) => row.name,
    render: (row) => (
      <span className={styles.name}>
        <ItemIcon icon={row.icon} name={row.name} size={28} />
        <span>{row.name}</span>
      </span>
    ),
    sortable: true,
  },
  { key: "cost", header: "Cost", value: (row) => row.cost, render: (row) => formatNumber(row.cost), sortable: true },
  {
    key: "health",
    header: "Health",
    value: (row) => row.health,
    render: (row) => formatNumber(row.health),
    sortable: true,
  },
  {
    key: "healthPerSupply",
    header: "Health / supply",
    value: (row) => row.healthPerSupply,
    render: (row) => formatNumber(row.healthPerSupply, { maxFractionDigits: 1 }),
    sortable: true,
  },
  {
    key: "repairSpeed",
    header: "Repair speed",
    value: (row) => row.repairSpeed,
    render: (row) => formatMultiplier(row.repairSpeed),
    sortable: true,
  },
  {
    key: "footprint",
    header: "Footprint",
    value: (row) => row.volume,
    render: (row) => formatFootprint(row.footprint),
    sortable: true,
  },
  { key: "tools", header: "Tools", value: (row) => formatList(row.tools), align: "start", sortable: true },
  {
    key: "placement",
    header: "Placement",
    value: (row) => formatList(row.placement),
    align: "start",
    sortable: true,
  },
  { key: "maxStack", header: "Max stack", value: (row) => row.maxStack, sortable: true },
];

export interface BuildableTableProps {
  rows: readonly BuildableRow[];
  onOpen: (row: BuildableRow) => void;
}

export function BuildableTable({ rows, onOpen }: BuildableTableProps) {
  return (
    <DataTable
      aria-label="Buildables"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.id}
      initialSort={{ column: "name", direction: "ascending" }}
      onRowClick={onOpen}
      emptyText="No buildables in this build."
    />
  );
}
