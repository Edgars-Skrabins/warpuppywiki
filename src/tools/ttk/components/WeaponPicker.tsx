import { ComboBox, OptionContent } from "@/ui";
import type { PlayerWeapon } from "@/core/weapons";

export interface WeaponPickerProps {
  weapons: readonly PlayerWeapon[];
  selectedId: string;
  caliberText: (weapon: PlayerWeapon) => string;
  onChange: (weaponId: string) => void;
}

function groupOf(weapon: PlayerWeapon): string {
  return weapon.archetype?.label ?? "Other";
}

export function WeaponPicker({ weapons, selectedId, caliberText, onChange }: WeaponPickerProps) {
  const sorted = [...weapons].sort(
    (a, b) => groupOf(a).localeCompare(groupOf(b), "en-US") || a.name.localeCompare(b.name, "en-US", { numeric: true }),
  );
  return (
    <ComboBox
      label="Weapon"
      items={sorted}
      getKey={(weapon) => weapon.id}
      getLabel={(weapon) => weapon.name}
      getSearchText={(weapon) => `${weapon.name} ${caliberText(weapon)} ${groupOf(weapon)}`}
      getGroup={groupOf}
      renderOption={(weapon) => <OptionContent label={weapon.name} secondary={caliberText(weapon)} />}
      selectedKey={selectedId}
      onSelectionChange={(key) => {
        if (key !== null) onChange(key);
      }}
      placeholder="Search weapons"
    />
  );
}
