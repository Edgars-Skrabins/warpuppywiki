import type { ReactNode } from "react";
import styles from "./ChartTooltip.module.css";

export interface ChartTooltipRow {
  key: string;
  label: string;
  color: string;
  value: string;
}

export interface ChartTooltipProps {
  title: ReactNode;
  rows: readonly ChartTooltipRow[];
}

export function ChartTooltip({ title, rows }: ChartTooltipProps) {
  return (
    <div className={styles.tooltip}>
      <div className={styles.title}>{title}</div>
      {rows.map((row) => (
        <div key={row.key} className={styles.row}>
          <span className={styles.swatch} style={{ background: row.color }} aria-hidden="true" />
          <span className={styles.label}>{row.label}</span>
          <span className={styles.value}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}
