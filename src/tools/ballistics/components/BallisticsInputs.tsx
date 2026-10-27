import { AMMO_TYPE_LABELS, type AmmoOption, type PlayerWeapon } from "@/core/weapons";
import { ComboBox, NumberField, Select } from "@/ui";
import type { ResolvedSetup, SetupSelection } from "../logic/setup";
import { MAX_TARGET_SPEED } from "../state";
import styles from "./BallisticsInputs.module.css";

export interface BallisticsInputsProps {
  label: string;
  weapons: readonly PlayerWeapon[];
  setup: ResolvedSetup;
  onChange: (selection: SetupSelection) => void;
}

export interface TargetSpeedFieldProps {
  value: number | null;
  onChange: (speed: number | null) => void;
}

function ammoLabel(option: AmmoOption): string {
  return `${option.item.name ?? option.item.id} · ${AMMO_TYPE_LABELS[option.ammoType]}`;
}

export function BallisticsInputs({ label, weapons, setup, onChange }: BallisticsInputsProps) {
  return (
    <div className={styles.inputs}>
      <ComboBox
        label={`Weapon ${label}`}
        items={weapons}
        getKey={(weapon) => weapon.id}
        getLabel={(weapon) => weapon.name}
        getGroup={(weapon) => weapon.archetype?.label ?? "Other"}
        selectedKey={setup.weapon.id}
        onSelectionChange={(key) => {
          if (key !== null) onChange({ weapon: key, ammo: null });
        }}
      />
      <Select
        label={`Ammo ${label}`}
        items={setup.ammoOptions}
        getKey={(option) => option.item.id}
        getLabel={ammoLabel}
        selectedKey={setup.ammo.item.id}
        onSelectionChange={(key) => {
          if (key !== null) onChange({ weapon: setup.weapon.id, ammo: key });
        }}
      />
    </div>
  );
}

export function TargetSpeedField({ value, onChange }: TargetSpeedFieldProps) {
  return (
    <NumberField
      label="Target speed (m/s)"
      className={styles.targetSpeed}
      minValue={0}
      maxValue={MAX_TARGET_SPEED}
      value={value ?? Number.NaN}
      description="Your input, for the lead column. The game data has no target speed."
      onChange={(speed) => onChange(Number.isFinite(speed) && speed > 0 ? speed : null)}
    />
  );
}
