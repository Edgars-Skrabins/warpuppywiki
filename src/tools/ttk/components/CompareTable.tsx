import { Badge, DataTable, formatNumber, formatSeconds, seriesColor, type Column } from "@/ui";
import type { CompareRow, CompareStatus } from "../logic/compareResults";
import styles from "./CompareTable.module.css";

export interface CompareTableProps {
  rows: readonly CompareRow[];
}

const REASONS: Record<Exclude<CompareStatus, "ok">, string> = {
  "not-killed": "Target not killed within 200 shots",
  explosive: "Not modeled: explosive weapon",
  "no-projectile": "No projectile data for this ammo",
  "unknown-weapon": "Weapon not in the game data",
  "no-ammo": "No ammunition in the game files",
  "no-zones": "Pick at least one hit zone",
};

function notes(row: CompareRow): string {
  if (row.status !== "ok") return REASONS[row.status];
  if (row.needsReload) {
    const capacity = row.result.matchup?.magazine?.capacity;
    return capacity === undefined ? "Needs a reload" : `Needs a reload (magazine holds ${capacity})`;
  }
  if (row.ttk === null) return "No fire rate in the game files";
  return "";
}

function withBest(text: string, best: boolean) {
  return (
    <span className={styles.value}>
      {best && <Badge tone="success">Best</Badge>}
      {text}
    </span>
  );
}

const COLUMNS: readonly Column<CompareRow>[] = [
  {
    key: "setup",
    header: "Setup",
    value: (row) => row.label,
    render: (row) => (
      <span className={styles.setup}>
        <span className={styles.swatch} style={{ background: seriesColor(row.index) }} aria-hidden="true" />
        <span>
          {row.index + 1}. {row.label}
        </span>
      </span>
    ),
  },
  {
    key: "stk",
    header: "STK",
    value: (row) => row.stk,
    render: (row) => withBest(row.stk === null ? "—" : formatNumber(row.stk), row.bestStk),
    align: "end",
  },
  {
    key: "ttk",
    header: "TTK",
    value: (row) => row.ttk,
    render: (row) => withBest(row.ttk === null ? "—" : formatSeconds(row.ttk), row.bestTtk),
    align: "end",
  },
  {
    key: "first",
    header: "First shot",
    value: (row) => row.firstShotDamage,
    render: (row) => formatNumber(row.firstShotDamage, { maxFractionDigits: 1 }),
    align: "end",
  },
  {
    key: "dps",
    header: "DPS (first shot)",
    value: (row) => row.dps,
    render: (row) => formatNumber(row.dps, { maxFractionDigits: 0 }),
    align: "end",
  },
  {
    key: "notes",
    header: "Notes",
    value: notes,
    render: (row) => <span className={row.status === "ok" ? styles.note : styles.reason}>{notes(row)}</span>,
  },
];

export function CompareTable({ rows }: CompareTableProps) {
  return (
    <DataTable
      aria-label="Comparison"
      columns={COLUMNS}
      rows={rows}
      getRowKey={(row) => `${row.index}`}
      emptyText="No setups"
    />
  );
}
