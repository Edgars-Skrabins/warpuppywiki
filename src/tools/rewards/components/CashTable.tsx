import type { CashReward } from "@/core/data";
import { DataTable, formatNumber, type Column } from "@/ui";
import styles from "./CashTable.module.css";

export const CASH_TABLE_NOTE =
  "The game files hold two reward tables that disagree on some numbers (for example a player kill pays a base of 250 here and 300 in the formulas); it isn't stated which one the live game uses.";

const columns: Column<CashReward>[] = [
  { key: "action", header: "Action", value: (row) => row.action, sortable: true },
  {
    key: "context",
    header: "Context",
    value: (row) => row.context,
    sortable: true,
    render: (row) => <span className={styles.code}>{row.context}</span>,
  },
  { key: "description", header: "Description", value: (row) => row.description ?? null },
  {
    key: "base",
    header: "Base",
    value: (row) => row.base,
    align: "end",
    sortable: true,
    render: (row) => formatNumber(row.base),
  },
  {
    key: "modifiers",
    header: "Modifiers",
    value: () => null,
    render: (row) => (
      <ul className={styles.modifiers}>
        {Object.entries(row.modifiers).map(([name, value]) => (
          <li key={name}>
            <span className={styles.modifierName}>{name}</span> {formatNumber(value)}
          </li>
        ))}
      </ul>
    ),
  },
];

export function CashTable({ rewards }: { rewards: readonly CashReward[] }) {
  return (
    <div className={styles.cashTable}>
      <p className={styles.note}>{CASH_TABLE_NOTE}</p>
      <DataTable
        aria-label="Cash reward table"
        columns={columns}
        rows={rewards}
        getRowKey={(row) => `${row.action}:${row.context}:${row.resource}`}
        initialSort={{ column: "action", direction: "ascending" }}
        emptyText="No cash rewards in this build."
      />
    </div>
  );
}
