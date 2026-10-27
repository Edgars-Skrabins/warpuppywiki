import type { ReactNode } from "react";
import styles from "./PopupDetails.module.css";

export interface PopupRow {
  label: string;
  value: ReactNode;
}

export interface PopupDetailsProps {
  title: string;
  subtitle?: string;
  rows: readonly PopupRow[];
}

export function PopupDetails({ title, subtitle, rows }: PopupDetailsProps) {
  return (
    <div className={styles.details}>
      <div className={styles.title}>{title}</div>
      {subtitle !== undefined && <div className={styles.subtitle}>{subtitle}</div>}
      <dl className={styles.rows}>
        {rows.map((row) => (
          <div key={row.label} className={styles.row}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
