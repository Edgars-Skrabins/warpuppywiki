import type { PlayerWeapon } from "@/core/weapons";
import { ComboBox } from "@/ui";
import { hasRecoilPattern } from "../logic/weaponSetup";
import styles from "./WeaponPicker.module.css";

export const NO_PATTERN_GROUP = "No recoil pattern in the game files";
const PATTERN_GROUP = "Weapons";

export interface WeaponPickerProps {
  label: string;
  weapons: readonly PlayerWeapon[];
  selectedId: string | null;
  onChange: (weaponId: string | null) => void;
}

export function WeaponPicker({ label, weapons, selectedId, onChange }: WeaponPickerProps) {
  const ordered = [...weapons.filter(hasRecoilPattern), ...weapons.filter((weapon) => !hasRecoilPattern(weapon))];
  return (
    <ComboBox<PlayerWeapon>
      label={label}
      items={ordered}
      getKey={(weapon) => weapon.id}
      getLabel={(weapon) => weapon.name}
      getGroup={(weapon) => (hasRecoilPattern(weapon) ? PATTERN_GROUP : NO_PATTERN_GROUP)}
      renderOption={(weapon) => (
        <span className={hasRecoilPattern(weapon) ? undefined : styles.noPattern}>{weapon.name}</span>
      )}
      selectedKey={selectedId}
      onSelectionChange={(key) => onChange(key)}
      placeholder="Choose a weapon"
    />
  );
}
