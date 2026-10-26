import type { Catalog } from "@/core/catalog";
import type { LootTable } from "@/core/data";
import { DataTable, type Column } from "@/ui";
import { useId, useMemo, useState } from "react";
import { itemSources, type ItemSource } from "../logic/itemSources";
import { formatChance } from "../logic/lootChances";
import { tableLabel } from "../logic/tableLabel";
import styles from "./FindItem.module.css";

interface FindItemProps {
  tables: readonly LootTable[];
  catalog: Catalog;
  onSelectTable: (id: string) => void;
}

function sourceKind(source: ItemSource): string {
  if (source.asEntry && source.asExtra) return "Item and extra";
  return source.asEntry ? "Item" : "Extra";
}

export function FindItem({ tables, catalog, onSelectTable }: FindItemProps) {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const needle = query.trim().toLowerCase();
  const nameOf = (itemId: string) => catalog.item(itemId)?.name ?? itemId;

  const sources = useMemo(() => {
    if (needle === "") return [];
    return itemSources(tables, (itemId) => {
      const name = catalog.item(itemId)?.name ?? itemId;
      return name.toLowerCase().includes(needle) || itemId.toLowerCase().includes(needle);
    });
  }, [tables, catalog, needle]);

  const columns: Column<ItemSource>[] = [
    { key: "item", header: "Item", value: (source) => nameOf(source.itemId), sortable: true },
    { key: "table", header: "Table", value: (source) => tableLabel(source.tableId), sortable: true },
    { key: "kind", header: "Drops as", value: sourceKind },
    {
      key: "chance",
      header: "Per spawn opportunity",
      value: (source) => source.chance,
      sortable: true,
      render: (source) => formatChance(source.chance),
    },
  ];

  return (
    <section className={styles.find}>
      <label className={styles.label} htmlFor={inputId}>
        Find an item
      </label>
      <input
        id={inputId}
        className={styles.search}
        type="search"
        placeholder="Item name, for example grenade"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {needle !== "" && (
        <DataTable
          aria-label="Tables that drop the item"
          columns={columns}
          rows={sources}
          getRowKey={(source) => `${source.tableId}|${source.itemId}`}
          onRowClick={(source) => onSelectTable(source.tableId)}
          emptyText="No loot table drops this item."
          maxHeight={320}
        />
      )}
    </section>
  );
}
