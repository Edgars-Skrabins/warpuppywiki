import type { LootTable } from "@/core/data";
import { useId, useState } from "react";
import { tableMatches } from "../logic/itemSources";
import { formatChance, tableSpawnChance } from "../logic/lootChances";
import { isOtherTable, tableLabel } from "../logic/tableLabel";
import styles from "./TableList.module.css";

interface TableListProps {
  tables: readonly LootTable[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  nameOf: (itemId: string) => string;
}

interface TableButtonsProps {
  tables: readonly LootTable[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}

function TableButtons({ tables, selectedId, onSelect }: TableButtonsProps) {
  return (
    <ul className={styles.list}>
      {tables.map((table) => (
        <li key={table.id}>
          <button
            type="button"
            className={styles.table}
            aria-current={table.id === selectedId ? "true" : undefined}
            onClick={() => onSelect(table.id)}
          >
            <span className={styles.label}>{tableLabel(table.id)}</span>
            <span className={styles.chance}>{formatChance(tableSpawnChance(table))}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function TableList({ tables, selectedId, onSelect, nameOf }: TableListProps) {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const matching = tables.filter((table) => tableMatches(table, query, nameOf));
  const main = matching.filter((table) => !isOtherTable(table.id));
  const other = matching.filter((table) => isOtherTable(table.id));

  return (
    <nav className={styles.tables} aria-label="Loot tables">
      <label className={styles.searchLabel} htmlFor={inputId}>
        Tables
      </label>
      <input
        id={inputId}
        className={styles.search}
        type="search"
        placeholder="Table or item"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {matching.length === 0 && <p className={styles.empty}>No table matches</p>}
      <TableButtons tables={main} selectedId={selectedId} onSelect={onSelect} />
      {other.length > 0 && (
        <details className={styles.other}>
          <summary className={styles.otherSummary}>Other</summary>
          <TableButtons tables={other} selectedId={selectedId} onSelect={onSelect} />
        </details>
      )}
    </nav>
  );
}
