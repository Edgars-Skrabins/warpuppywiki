import { DEFAULT_HEALTH, modelNotes } from "@/core/damage";
import { Panel, Tab, TabList, TabPanel, Tabs } from "@/ui";
import type { LethalityView, Loadout } from "../model/loadout";
import type { LethalityModel } from "../model/lethality";
import { Hint } from "./Hint";
import { YourArmorTable } from "./YourArmorTable";
import { YourWeaponsTable } from "./YourWeaponsTable";
import styles from "./Lethality.module.css";

function isTab(key: unknown): key is LethalityView["tab"] {
  return key === "weapons" || key === "armor";
}

export interface LethalityPanelProps {
  loadout: Loadout;
  model: LethalityModel;
  onViewChange: (changes: Partial<LethalityView>) => void;
}

export function LethalityPanel({ loadout, model, onViewChange }: LethalityPanelProps) {
  const notes = modelNotes(model.damage.gameBuild);
  return (
    <Panel
      title="Lethality"
      description="Shots and time to kill for this kit, from the shared damage model."
      actions={
        <Hint
          content={
            <ul className={styles.notes}>
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          }
        >
          Health {DEFAULT_HEALTH} (assumed)
        </Hint>
      }
    >
      <Tabs
        selectedKey={loadout.view.lethality.tab}
        onSelectionChange={(key) => {
          if (isTab(key)) onViewChange({ tab: key });
        }}
      >
        <TabList aria-label="Lethality views">
          <Tab id="weapons">Your weapons</Tab>
          <Tab id="armor">Your armor</Tab>
        </TabList>
        <TabPanel id="weapons">
          <YourWeaponsTable loadout={loadout} model={model} onViewChange={onViewChange} />
        </TabPanel>
        <TabPanel id="armor">
          <YourArmorTable loadout={loadout} model={model} onViewChange={onViewChange} />
        </TabPanel>
      </Tabs>
    </Panel>
  );
}
