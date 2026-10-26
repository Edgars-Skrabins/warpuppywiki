import type { ReactNode } from "react";
import { Card } from "../Card";
import styles from "./ChartCard.module.css";

export interface LegendEntry {
  key: string;
  label: string;
  color: string;
  kind: "line" | "bar";
}

export interface ChartCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  legend: readonly LegendEntry[];
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, actions, legend, children, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <figure className={styles.figure}>
        <figcaption className={styles.header}>
          <div className={styles.headerText}>
            <h3 className={styles.title}>{title}</h3>
            {subtitle !== undefined && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {actions !== undefined && <div className={styles.actions}>{actions}</div>}
        </figcaption>
        {legend.length > 1 && (
          <ul className={styles.legend} aria-label="Legend">
            {legend.map((entry) => (
              <li key={entry.key} className={styles.legendItem}>
                <span
                  className={entry.kind === "line" ? styles.lineKey : styles.barKey}
                  style={{ background: entry.color }}
                  aria-hidden="true"
                />
                {entry.label}
              </li>
            ))}
          </ul>
        )}
        <div className={styles.plot}>{children}</div>
      </figure>
    </Card>
  );
}
