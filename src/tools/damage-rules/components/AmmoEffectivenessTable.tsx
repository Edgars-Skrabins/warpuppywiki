import type { AmmoTypeEffect } from "@/core/data";
import { DataTable, formatMultiplier, type Column } from "@/ui";
import { ammoTypeLabel, effectivenessText } from "../logic/effectivenessText";
import { ARMS_CLASSES } from "../logic/vehicleSeatRows";
import styles from "./ReferenceTable.module.css";

export interface AmmoEffectivenessTableProps {
  ammoTypes: readonly AmmoTypeEffect[];
}

const columns: readonly Column<AmmoTypeEffect>[] = [
  { key: "ammo", header: "Ammo type", value: (row) => ammoTypeLabel(row.ammoType), sortable: true },
  {
    key: "modifier",
    header: "Default",
    value: (row) => row.modifier,
    render: (row) => formatMultiplier(row.modifier),
    align: "end",
    sortable: true,
  },
  ...ARMS_CLASSES.map<Column<AmmoTypeEffect>>((armsClass) => ({
    key: armsClass,
    header: armsClass,
    value: (row) => row.byArmsClass[armsClass] ?? null,
    render: (row) => formatMultiplier(row.byArmsClass[armsClass]),
    align: "end",
  })),
  {
    key: "text",
    header: "What it means",
    value: (row) => effectivenessText(row),
    render: (row) => <span className={styles.text}>{effectivenessText(row)}</span>,
  },
];

export function AmmoEffectivenessTable({ ammoTypes }: AmmoEffectivenessTableProps) {
  return (
    <div className={styles.section}>
      <p className={styles.note}>
        Each ammo type scales the damage reduction of the armor it hits. Below 1 the armor protects less, above 1 it
        protects more. A value per arms class replaces the default for weapons of that class.
      </p>
      <DataTable
        aria-label="Ammo effectiveness against armor"
        columns={columns}
        rows={ammoTypes}
        getRowKey={(row) => row.ammoType}
        emptyText="No ammo types in this build."
      />
    </div>
  );
}
