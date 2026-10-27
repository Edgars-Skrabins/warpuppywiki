import type { Armor } from "@/core/data";
import { NumberField, Select, Slider, formatPercent } from "@/ui";
import type { ArmorOptions } from "../logic/buildScenario";
import type { MatchupState } from "../state";
import styles from "./MatchupPanel.module.css";

const NONE = { id: "none", name: "None" };

type ArmorChoice = { id: string; name: string };

function choices(options: readonly Armor[]): ArmorChoice[] {
  return [NONE, ...options.map((armor) => ({ id: armor.id, name: armor.name ?? armor.id }))];
}

export interface TargetPanelProps {
  state: MatchupState;
  armor: ArmorOptions;
  onChange: (patch: Partial<MatchupState>) => void;
}

export function TargetPanel({ state, armor, onChange }: TargetPanelProps) {
  return (
    <div className={styles.group}>
      <NumberField
        label="Health"
        minValue={1}
        maxValue={1000}
        value={state.health}
        onChange={(health) => {
          if (Number.isFinite(health)) onChange({ health });
        }}
      />
      <Select
        label="Body armor"
        items={choices(armor.body)}
        getKey={(choice) => choice.id}
        getLabel={(choice) => choice.name}
        selectedKey={state.bodyArmorId ?? NONE.id}
        onSelectionChange={(key) => onChange({ bodyArmorId: key === null || key === NONE.id ? null : key })}
      />
      <Select
        label="Helmet"
        items={choices(armor.helmets)}
        getKey={(choice) => choice.id}
        getLabel={(choice) => choice.name}
        selectedKey={state.helmetId ?? NONE.id}
        onSelectionChange={(key) => onChange({ helmetId: key === null || key === NONE.id ? null : key })}
      />
      <Slider
        label="Armor condition"
        minValue={0}
        maxValue={1}
        step={0.05}
        value={state.condition}
        formatValue={(value) => formatPercent(value)}
        onChange={(condition) => onChange({ condition })}
      />
    </div>
  );
}
