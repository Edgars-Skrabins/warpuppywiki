import type { CSSProperties } from "react";
import { Icon } from "@/ui";
import type { LayerDefinition } from "../layers/layerDefinitions";
import { BUILDING_STYLES, type BuildingKind } from "../logic/buildingStyle";
import { FACTION_LABELS, FACTIONS, type FactionKey } from "../logic/objectGroups";
import { classNames } from "./classNames";
import styles from "./Legend.module.css";

function colorStyle(token: string): CSSProperties {
  return { "--swatch-color": `var(${token})` } as CSSProperties;
}

export function LayerSwatch({ definition }: { definition: LayerDefinition }) {
  if (definition.swatch === "icon" && definition.icon !== null) {
    return (
      <span className={classNames(styles.swatch, styles.icon)} style={colorStyle(definition.color)} aria-hidden="true">
        <Icon name={definition.icon} size={12} />
      </span>
    );
  }
  return (
    <span
      className={classNames(styles.swatch, styles[definition.swatch])}
      style={colorStyle(definition.color)}
      aria-hidden="true"
    />
  );
}

export function BuildingSwatch({ kind }: { kind: BuildingKind }) {
  return (
    <span
      className={classNames(styles.swatch, styles.building)}
      style={colorStyle(BUILDING_STYLES[kind].color)}
      aria-hidden="true"
    />
  );
}

function factionToken(faction: FactionKey): string {
  return `--faction-${faction}`;
}

export function Legend() {
  return (
    <div className={styles.legend}>
      <p className={styles.heading}>Factions</p>
      <ul className={styles.factions}>
        {FACTIONS.map((faction) => (
          <li key={faction} className={styles.faction}>
            <span
              className={classNames(styles.swatch, styles.factionSwatch)}
              style={colorStyle(factionToken(faction))}
              aria-hidden="true"
            />
            {FACTION_LABELS[faction]}
          </li>
        ))}
      </ul>
      <p className={styles.note}>Faction ids as in the game data; their in-game names are not linked to them.</p>
    </div>
  );
}
