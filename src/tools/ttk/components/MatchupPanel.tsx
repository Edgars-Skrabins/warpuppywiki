import type { PlayerWeapon } from "@/core/weapons";
import { Panel } from "@/ui";
import type { ArmorOptions, ResolvedMatchup } from "../logic/buildScenario";
import type { MatchupState } from "../state";
import styles from "./MatchupPanel.module.css";
import { PelletsField } from "./PelletsField";
import { SetupFields } from "./SetupFields";
import { ShotFields } from "./ShotFields";
import { TargetPanel } from "./TargetPanel";

export interface MatchupPanelProps {
  state: MatchupState;
  matchup: ResolvedMatchup;
  weapons: readonly PlayerWeapon[];
  armor: ArmorOptions;
  caliberText: (weapon: PlayerWeapon) => string;
  onChange: (patch: Partial<MatchupState>) => void;
}

export function MatchupPanel({ state, matchup, weapons, armor, caliberText, onChange }: MatchupPanelProps) {
  return (
    <div className={styles.panel}>
      <Panel title="Matchup" headingLevel={2}>
        <div className={styles.group}>
          <SetupFields matchup={matchup} weapons={weapons} caliberText={caliberText} onChange={onChange} />
          <ShotFields shared={state} worn={[matchup.bodyArmor, matchup.helmet]} onChange={onChange} />
        </div>
      </Panel>
      <Panel title="Target" headingLevel={2}>
        <TargetPanel state={state} armor={armor} onChange={onChange} />
        {matchup.isShotgun && <PelletsField value={state.pellets} onChange={(pellets) => onChange({ pellets })} />}
      </Panel>
    </div>
  );
}
