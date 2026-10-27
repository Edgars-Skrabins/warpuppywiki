import type { PlayerWeapon } from "@/core/weapons";
import { Button, seriesColor } from "@/ui";
import type { ResolvedMatchup } from "../logic/buildScenario";
import type { Setup } from "../state";
import { SetupFields } from "./SetupFields";
import styles from "./SetupRow.module.css";
import { WeaponPicker } from "./WeaponPicker";

export interface SetupRowProps {
  index: number;
  matchup: ResolvedMatchup | null;
  weapons: readonly PlayerWeapon[];
  caliberText: (weapon: PlayerWeapon) => string;
  canDuplicate: boolean;
  canRemove: boolean;
  onChange: (patch: Partial<Setup>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

export function SetupRow({
  index,
  matchup,
  weapons,
  caliberText,
  canDuplicate,
  canRemove,
  onChange,
  onDuplicate,
  onRemove,
}: SetupRowProps) {
  const name = `Setup ${index + 1}`;
  return (
    <div className={styles.row} role="group" aria-label={name}>
      <div className={styles.header}>
        <span className={styles.title}>
          <span className={styles.swatch} style={{ background: seriesColor(index) }} aria-hidden="true" />
          {name}
        </span>
        <span className={styles.actions}>
          <Button variant="ghost" size="sm" isDisabled={!canDuplicate} onPress={onDuplicate}>
            Duplicate
          </Button>
          <Button variant="ghost" size="sm" isDisabled={!canRemove} onPress={onRemove}>
            Remove
          </Button>
        </span>
      </div>
      <div className={styles.fields}>
        {matchup === null ? (
          <>
            <WeaponPicker
              weapons={weapons}
              selectedId=""
              caliberText={caliberText}
              onChange={(weaponId) => onChange({ weaponId, ammoType: "FMJ", magazineId: null })}
            />
            <p className={styles.note}>This weapon is not in the game data; pick another.</p>
          </>
        ) : (
          <SetupFields matchup={matchup} weapons={weapons} caliberText={caliberText} onChange={onChange} />
        )}
      </div>
    </div>
  );
}
