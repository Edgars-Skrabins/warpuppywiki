import type { PlayerWeapon } from "@/core/weapons";
import { Select } from "@/ui";
import type { ResolvedMatchup } from "../logic/buildScenario";
import type { Setup } from "../state";
import { AmmoPicker } from "./AmmoPicker";
import { WeaponPicker } from "./WeaponPicker";

export interface SetupFieldsProps {
  matchup: ResolvedMatchup;
  weapons: readonly PlayerWeapon[];
  caliberText: (weapon: PlayerWeapon) => string;
  onChange: (patch: Partial<Setup>) => void;
}

export function SetupFields({ matchup, weapons, caliberText, onChange }: SetupFieldsProps) {
  return (
    <>
      <WeaponPicker
        weapons={weapons}
        selectedId={matchup.weapon.id}
        caliberText={caliberText}
        onChange={(weaponId) => onChange({ weaponId, ammoType: "FMJ", magazineId: null })}
      />
      <AmmoPicker
        options={matchup.ammoOptions}
        value={matchup.ammo?.ammoType ?? null}
        onChange={(ammoType) => onChange({ ammoType })}
      />
      {matchup.magazines.length > 0 && (
        <Select
          label="Magazine"
          items={matchup.magazines}
          getKey={(option) => option.attachment.id}
          getLabel={(option) => `${option.item.name} (${option.capacity})`}
          selectedKey={matchup.magazine?.attachment.id ?? null}
          onSelectionChange={(key) => onChange({ magazineId: key })}
        />
      )}
    </>
  );
}
