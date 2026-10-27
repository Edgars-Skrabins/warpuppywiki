import type { ReactNode } from "react";
import { Checkbox, formatNumber } from "@/ui";
import { classNames } from "./classNames";
import styles from "./LayerToggle.module.css";

export interface LayerToggleProps {
  label: string;
  swatch: ReactNode;
  isSelected: boolean;
  onChange: (isSelected: boolean) => void;
  count: number | null;
  isDisabled?: boolean;
  note?: string | null;
  nested?: boolean;
}

export function LayerToggle({
  label,
  swatch,
  isSelected,
  onChange,
  count,
  isDisabled = false,
  note = null,
  nested = false,
}: LayerToggleProps) {
  return (
    <div className={classNames(styles.toggle, nested && styles.nested)}>
      <Checkbox
        className={styles.checkbox}
        isSelected={isSelected && !isDisabled}
        isDisabled={isDisabled}
        onChange={onChange}
      >
        {swatch}
        <span className={styles.label}>{label}</span>
        {count !== null && count > 0 && <span className={styles.count}>{formatNumber(count)}</span>}
      </Checkbox>
      {note !== null && <p className={styles.note}>{note}</p>}
    </div>
  );
}
