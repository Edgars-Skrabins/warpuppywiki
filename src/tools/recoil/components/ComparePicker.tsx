import type { PlayerWeapon } from "@/core/weapons";
import { Button } from "@/ui";
import { WeaponPicker } from "./WeaponPicker";

export interface ComparePickerProps {
  weapons: readonly PlayerWeapon[];
  comparing: boolean;
  selectedId: string | null;
  onAdd: () => void;
  onRemove: () => void;
  onChange: (weaponId: string | null) => void;
}

export function ComparePicker({ weapons, comparing, selectedId, onAdd, onRemove, onChange }: ComparePickerProps) {
  if (!comparing) {
    return <Button onPress={onAdd}>Add comparison</Button>;
  }
  return (
    <>
      <WeaponPicker label="Comparison weapon" weapons={weapons} selectedId={selectedId} onChange={onChange} />
      <Button variant="ghost" size="sm" onPress={onRemove}>
        Remove comparison
      </Button>
    </>
  );
}
