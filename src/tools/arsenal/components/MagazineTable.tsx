import { AMMO_TYPE_LABELS } from "@/core/weapons";
import { DataTable, EMPTY_VALUE, formatCash, type Column } from "@/ui";
import type { MagazineRow } from "../logic/weaponDetail";
import styles from "./WeaponDetail.module.css";

export interface MagazineTableProps {
  rows: readonly MagazineRow[];
}

const COLUMNS: Column<MagazineRow>[] = [
  { key: "name", header: "Magazine", value: (row) => row.name, sortable: true },
  { key: "capacity", header: "Capacity", value: (row) => row.capacity, sortable: true },
  {
    key: "empty",
    header: "Empty",
    value: (row) => row.emptyPrice,
    render: (row) => formatCash(row.emptyPrice),
    sortable: true,
  },
  {
    key: "loaded",
    header: "Loaded",
    value: () => null,
    align: "start",
    render: (row) =>
      row.loaded.length === 0 ? (
        EMPTY_VALUE
      ) : (
        <ul className={styles.inlineList}>
          {row.loaded.map((entry) => (
            <li key={entry.ammoType}>
              {AMMO_TYPE_LABELS[entry.ammoType]} {formatCash(entry.price)}
            </li>
          ))}
        </ul>
      ),
  },
];

export function MagazineTable({ rows }: MagazineTableProps) {
  return (
    <DataTable
      aria-label="Magazines"
      columns={COLUMNS}
      rows={rows}
      getRowKey={(row) => row.id}
      emptyText="This weapon has no swappable magazines"
      maxHeight="none"
    />
  );
}
