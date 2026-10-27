import type { Attachment } from "@/core/data";
import { AMMO_TYPE_LABELS, type AmmoOption, type PlayerWeapon } from "@/core/weapons";
import { ComboBox, Select, formatDistance } from "@/ui";
import type { ResolvedSetup, SetupSelection } from "../logic/setup";
import styles from "./BallisticsInputs.module.css";

const NO_SIGHT = "none";

interface ZeroOption {
  id: string;
  distance: number;
}

interface SightOption {
  id: string;
  name: string;
}

export interface BallisticsInputsProps {
  label: string;
  weapons: readonly PlayerWeapon[];
  setup: ResolvedSetup;
  onChange: (selection: SetupSelection) => void;
}

function ammoLabel(option: AmmoOption): string {
  return `${option.item.name ?? option.item.id} · ${AMMO_TYPE_LABELS[option.ammoType]}`;
}

function sightOptions(sights: readonly Attachment[]): SightOption[] {
  return [
    { id: NO_SIGHT, name: "Iron sights" },
    ...sights.map((sight) => ({ id: sight.id, name: sight.name ?? sight.id })),
  ];
}

export function BallisticsInputs({ label, weapons, setup, onChange }: BallisticsInputsProps) {
  const selection: SetupSelection = {
    weapon: setup.weapon.id,
    ammo: setup.ammo.item.id,
    sight: setup.sight?.id ?? null,
    zero: setup.zero,
  };
  const zeros: ZeroOption[] = setup.zeroOptions.map((distance) => ({ id: String(distance), distance }));
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
          if (key !== null) onChange({ weapon: key, ammo: null, sight: null, zero: null });
        }}
      />
      <Select
        label={`Ammo ${label}`}
        items={setup.ammoOptions}
        getKey={(option) => option.item.id}
        getLabel={ammoLabel}
        selectedKey={setup.ammo.item.id}
        onSelectionChange={(key) => {
          if (key !== null) onChange({ ...selection, ammo: key });
        }}
      />
      {setup.sights.length > 0 && (
        <Select
          label={`Sight ${label}`}
          items={sightOptions(setup.sights)}
          getKey={(option) => option.id}
          getLabel={(option) => option.name}
          selectedKey={setup.sight?.id ?? NO_SIGHT}
          onSelectionChange={(key) => {
            if (key !== null) onChange({ ...selection, sight: key === NO_SIGHT ? null : key, zero: null });
          }}
        />
      )}
      <Select
        label={`Zero ${label}`}
        items={zeros}
        getKey={(option) => option.id}
        getLabel={(option) => formatDistance(option.distance)}
        selectedKey={String(setup.zero)}
        isDisabled={zeros.length < 2}
        onSelectionChange={(key) => {
          if (key !== null) onChange({ ...selection, zero: Number(key) });
        }}
      />
    </div>
  );
}
