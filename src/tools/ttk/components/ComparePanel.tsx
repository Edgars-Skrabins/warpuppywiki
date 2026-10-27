import type { Armor } from "@/core/data";
import type { PlayerWeapon } from "@/core/weapons";
import { Button, Panel } from "@/ui";
import type { ArmorOptions } from "../logic/buildScenario";
import type { CompareRow } from "../logic/compareResults";
import { MAX_SETUPS, type Setup, type SharedTargetState } from "../state";
import styles from "./ComparePanel.module.css";
import panelStyles from "./MatchupPanel.module.css";
import { PelletsField } from "./PelletsField";
import { SetupRow } from "./SetupRow";
import { ShotFields } from "./ShotFields";
import { TargetPanel } from "./TargetPanel";

export interface ComparePanelProps {
  shared: SharedTargetState;
  armor: ArmorOptions;
  worn: readonly (Armor | null)[];
  hasShotgun: boolean;
  onChange: (patch: Partial<SharedTargetState>) => void;
}

export function ComparePanel({ shared, armor, worn, hasShotgun, onChange }: ComparePanelProps) {
  return (
    <div className={panelStyles.panel}>
      <Panel title="Shots" headingLevel={2}>
        <div className={panelStyles.group}>
          <ShotFields shared={shared} worn={worn} onChange={onChange} />
        </div>
      </Panel>
      <Panel title="Target" headingLevel={2}>
        <TargetPanel state={shared} armor={armor} onChange={onChange} />
        {hasShotgun && <PelletsField value={shared.pellets} onChange={(pellets) => onChange({ pellets })} />}
      </Panel>
    </div>
  );
}

export interface SetupListProps {
  rows: readonly CompareRow[];
  weapons: readonly PlayerWeapon[];
  caliberText: (weapon: PlayerWeapon) => string;
  onChange: (index: number, patch: Partial<Setup>) => void;
  onAdd: () => void;
  onDuplicate: (index: number) => void;
  onRemove: (index: number) => void;
}

export function SetupList({ rows, weapons, caliberText, onChange, onAdd, onDuplicate, onRemove }: SetupListProps) {
  const full = rows.length >= MAX_SETUPS;
  return (
    <Panel
      title="Setups"
      headingLevel={2}
      actions={
        <Button size="sm" isDisabled={full} onPress={onAdd}>
          Add setup
        </Button>
      }
    >
      <div className={styles.setups}>
        {rows.map((row) => (
          <SetupRow
            key={row.index}
            index={row.index}
            matchup={row.result.matchup}
            weapons={weapons}
            caliberText={caliberText}
            canDuplicate={!full}
            canRemove={rows.length > 1}
            onChange={(patch) => onChange(row.index, patch)}
            onDuplicate={() => onDuplicate(row.index)}
            onRemove={() => onRemove(row.index)}
          />
        ))}
      </div>
    </Panel>
  );
}
