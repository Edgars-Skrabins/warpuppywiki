import type { Catalog } from "@/core/catalog";
import type { LootTable } from "@/core/data";
import { DataTable, formatNumber, ItemIcon, type Column } from "@/ui";
import { useMemo } from "react";
import { entryChances, extraText, formatChance, type LootEntryChance } from "../logic/lootChances";
import styles from "./EntriesTable.module.css";

interface EntryRow extends LootEntryChance {
  key: string;
}

interface EntriesTableProps {
  table: LootTable;
  catalog: Catalog;
}

export function EntriesTable({ table, catalog }: EntriesTableProps) {
  const rows = useMemo<EntryRow[]>(
    () => entryChances(table).map((entry, index) => ({ ...entry, key: `${index}` })),
    [table],
  );
  const nameOf = (itemId: string) => catalog.item(itemId)?.name ?? itemId;

  const columns: Column<EntryRow>[] = [
    {
      key: "icon",
      header: "",
      value: () => null,
      render: (row) => {
        const item = catalog.item(row.item);
        return (
          <span className={styles.icon}>
            <ItemIcon icon={item?.icon} name={nameOf(row.item)} size={28} shape="wide" />
          </span>
        );
      },
    },
    {
      key: "item",
      header: "Item",
      value: (row) => nameOf(row.item),
      sortable: true,
      render: (row) =>
        catalog.item(row.item) ? (
          nameOf(row.item)
        ) : (
          <span className={styles.unknown}>
            <span>{row.item}</span>
            <span className={styles.unknownLabel}>Unknown item</span>
          </span>
        ),
    },
    { key: "amount", header: "Amount", value: (row) => row.amount, render: (row) => formatNumber(row.amount) },
    {
      key: "entryChance",
      header: "If the table spawns",
      value: (row) => row.entryChance,
      sortable: true,
      render: (row) => formatChance(row.entryChance),
    },
    {
      key: "overallChance",
      header: "Per spawn opportunity",
      value: (row) => row.overallChance,
      sortable: true,
      render: (row) => formatChance(row.overallChance),
    },
    {
      key: "extras",
      header: "Comes with",
      value: (row) => row.extras.length,
      align: "start",
      render: (row) =>
        row.extras.length === 0 ? (
          <span className={styles.none}>Nothing</span>
        ) : (
          <ul className={styles.extras}>
            {row.extras.map((extra, index) => (
              <li key={index}>{extraText(extra, nameOf(extra.item))}</li>
            ))}
          </ul>
        ),
    },
  ];

  return (
    <DataTable
      aria-label="Entries"
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.key}
      emptyText="This table has no entries."
    />
  );
}
