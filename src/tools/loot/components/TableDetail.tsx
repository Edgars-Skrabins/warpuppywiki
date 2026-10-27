import type { Catalog } from "@/core/catalog";
import type { LootTable } from "@/core/data";
import { Panel } from "@/ui";
import { tableLabel } from "../logic/tableLabel";
import { EntriesTable } from "./EntriesTable";
import { SpawnRules } from "./SpawnRules";
import styles from "./TableDetail.module.css";

interface TableDetailProps {
  table: LootTable;
  catalog: Catalog;
}

export function TableDetail({ table, catalog }: TableDetailProps) {
  return (
    <Panel title={tableLabel(table.id)} description={table.id} className={styles.detail}>
      <div className={styles.body}>
        <SpawnRules table={table} />
        <EntriesTable table={table} catalog={catalog} />
        <p className={styles.note}>Where to find: loot positions are decided during a match and are not in the data.</p>
      </div>
    </Panel>
  );
}
