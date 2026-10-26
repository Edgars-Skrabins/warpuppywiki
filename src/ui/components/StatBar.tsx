import { Label, Meter } from "react-aria-components";
import type { ReactNode } from "react";
import { formatNumber } from "../format";
import { classNames } from "./classNames";
import styles from "./StatBar.module.css";

export type StatBarTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

export interface StatBarProps {
  label: string;
  value: number;
  max: number;
  min?: number;
  format?: (value: number) => string;
  tone?: StatBarTone;
  trailing?: ReactNode;
  className?: string;
}

export function StatBar({
  label,
  value,
  max,
  min = 0,
  format = (n) => formatNumber(n),
  tone = "neutral",
  trailing,
  className,
}: StatBarProps) {
  return (
    <Meter
      value={value}
      minValue={min}
      maxValue={max}
      valueLabel={format(value)}
      className={classNames(styles.statBar, className)}
    >
      {({ percentage, valueText }) => (
        <>
          <div className={styles.header}>
            <Label className={styles.label}>{label}</Label>
            <span className={styles.value}>
              {valueText}
              {trailing}
            </span>
          </div>
          <div className={styles.track}>
            <div className={classNames(styles.fill, styles[tone])} style={{ width: `${percentage}%` }} />
          </div>
        </>
      )}
    </Meter>
  );
}
