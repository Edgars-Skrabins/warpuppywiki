import { DataTable, formatNumber, type Column } from "@/ui";
import type { NameKind, ResolvedName } from "../model/resolveNames";
import styles from "./WorkingTable.module.css";

const KIND_LABELS: Record<NameKind, string> = { literal: "Literal", game: "Game input", curve: "Curve" };

function reasonText(entry: ResolvedName): string {
  if (entry.reason === null) {
    return "Variable";
  }
  return entry.reason === "default" ? "Default" : entry.reason;
}

const columns: Column<ResolvedName>[] = [
  {
    key: "name",
    header: "Name",
    value: (entry) => entry.name,
    render: (entry) => <code className={styles.code}>{entry.name}</code>,
  },
  {
    key: "resolved",
    header: "Resolved to",
    value: (entry) => entry.variable,
    render: (entry) => (
      <span className={styles.resolved}>
        <code className={styles.code}>
          {entry.variable === null ? entry.name : `${entry.name} → ${entry.variable}`}
        </code>
        <span className={styles.reason}>{reasonText(entry)}</span>
      </span>
    ),
  },
  {
    key: "kind",
    header: "Type",
    value: (entry) => (entry.kind === null ? null : KIND_LABELS[entry.kind]),
  },
  {
    key: "value",
    header: "Value",
    align: "end",
    value: (entry) => entry.value,
    render: (entry) =>
      entry.error !== null ? (
        <span className={styles.error}>{entry.error}</span>
      ) : (
        formatNumber(entry.value, { maxFractionDigits: 4 })
      ),
  },
];

export function WorkingTable({ working, label }: { working: readonly ResolvedName[]; label: string }) {
  return (
    <DataTable
      aria-label={label}
      columns={columns}
      rows={working}
      getRowKey={(entry) => entry.name}
      emptyText="This formula uses no names."
    />
  );
}
