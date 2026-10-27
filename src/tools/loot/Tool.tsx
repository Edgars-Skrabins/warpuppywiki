import { sameId, useCatalog, type Catalog } from "@/core/catalog";
import { useGameData, type LootTable } from "@/core/data";
import { useUrlState } from "@/core/state";
import { DataStateView, EmptyState } from "@/ui";
import { useCallback, useMemo } from "react";
import { FindItem } from "./components/FindItem";
import { TableDetail } from "./components/TableDetail";
import { TableList } from "./components/TableList";
import { isOtherTable, tableLabel } from "./logic/tableLabel";
import { tableState } from "./state";
import styles from "./Tool.module.css";

interface LootTablesProps {
  tables: readonly LootTable[];
  catalog: Catalog;
}

function LootTables({ tables, catalog }: LootTablesProps) {
  const [selectedId, setSelectedId] = useUrlState(tableState);
  const sorted = useMemo(() => [...tables].sort((a, b) => tableLabel(a.id).localeCompare(tableLabel(b.id))), [tables]);
  const nameOf = useCallback((itemId: string) => catalog.item(itemId)?.name ?? itemId, [catalog]);
  const selected =
    sorted.find((table) => sameId(table.id, selectedId)) ?? sorted.find((table) => !isOtherTable(table.id));

  return (
    <div className={styles.tool}>
      <FindItem tables={sorted} catalog={catalog} onSelectTable={setSelectedId} />
      <div className={styles.columns}>
        <TableList tables={sorted} selectedId={selected?.id} onSelect={setSelectedId} nameOf={nameOf} />
        {selected ? (
          <TableDetail table={selected} catalog={catalog} />
        ) : (
          <EmptyState title="No loot tables" text="This game build has no loot tables." />
        )}
      </div>
    </div>
  );
}

export default function Tool() {
  const loot = useGameData("loot");
  const catalog = useCatalog();
  return (
    <DataStateView state={loot}>
      {(file) => (
        <DataStateView state={catalog}>
          {(loadedCatalog) => <LootTables tables={file.tables} catalog={loadedCatalog} />}
        </DataStateView>
      )}
    </DataStateView>
  );
}
