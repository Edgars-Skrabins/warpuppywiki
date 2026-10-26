import type { ReactNode } from "react";
import { classNames } from "./classNames";
import styles from "./StatRow.module.css";

export interface StatRowProps {
  label: ReactNode;
  value: ReactNode;
  unit?: string;
  delta?: ReactNode;
  hint?: ReactNode;
  className?: string;
}

export function StatRow({ label, value, unit, delta, hint, className }: StatRowProps) {
  return (
    <div className={classNames(styles.row, className)}>
      <span className={styles.label}>
        {label}
        {hint !== undefined && <span className={styles.hint}>{hint}</span>}
      </span>
      <span className={styles.value}>
        {value}
        {unit !== undefined && <span className={styles.unit}>{unit}</span>}
      </span>
      {delta !== undefined && <span className={styles.delta}>{delta}</span>}
    </div>
  );
}
