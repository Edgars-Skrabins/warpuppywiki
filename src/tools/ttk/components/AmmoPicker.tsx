import { AMMO_TYPE_LABELS, type AmmoOption, type AmmoTypeKey } from "@/core/weapons";
import { SegmentedControl } from "@/ui";
import styles from "./MatchupPanel.module.css";

export interface AmmoPickerProps {
  options: readonly AmmoOption[];
  value: AmmoTypeKey | null;
  onChange: (ammoType: AmmoTypeKey) => void;
}

export function AmmoPicker({ options, value, onChange }: AmmoPickerProps) {
  const types = [...new Set(options.map((option) => option.ammoType))];
  if (value === null || types.length === 0) {
    return <p className={styles.note}>No ammunition for this weapon in the game files.</p>;
  }
  return (
    <div className={styles.field}>
      <span className={styles.label}>Ammo</span>
      <SegmentedControl
        aria-label="Ammo"
        size="sm"
        className={styles.wrap}
        options={types.map((type) => ({ id: type, label: AMMO_TYPE_LABELS[type] }))}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
