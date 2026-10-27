import { useId, useState } from "react";
import { Button } from "@/ui";
import {
  LAYER_GROUP_LABELS,
  LAYER_GROUPS,
  LAYERS,
  type LayerDefinition,
  type LayerId,
} from "../layers/layerDefinitions";
import type { LayerData } from "../layers/useLayerData";
import { BUILDING_KINDS, BUILDING_STYLES, type BuildingKind } from "../logic/buildingStyle";
import { BuildingSwatch, LayerSwatch, Legend } from "./Legend";
import { LayerToggle } from "./LayerToggle";
import styles from "./LayersPanel.module.css";

export const NONE_ON_MAP = "None on this map";

const NARROW_QUERY = "(max-width: 640px)";

export interface LayersPanelProps {
  data: LayerData;
  layers: Record<LayerId, boolean>;
  buildingKinds: Record<BuildingKind, boolean>;
  zoom: number | null;
  onLayerChange: (id: LayerId, on: boolean) => void;
  onBuildingKindChange: (kind: BuildingKind, on: boolean) => void;
}

function startsOpen(): boolean {
  return typeof window.matchMedia !== "function" || !window.matchMedia(NARROW_QUERY).matches;
}

function layerNote(definition: LayerDefinition, count: number | null | undefined, on: boolean, zoom: number | null) {
  if (count === 0) {
    return NONE_ON_MAP;
  }
  if (on && definition.minZoom !== null && zoom !== null && zoom < definition.minZoom) {
    return `Shown from zoom ${definition.minZoom}`;
  }
  return null;
}

export function LayersPanel({
  data,
  layers,
  buildingKinds,
  zoom,
  onLayerChange,
  onBuildingKindChange,
}: LayersPanelProps) {
  const [open, setOpen] = useState(startsOpen);
  const bodyId = useId();
  const presentKinds = BUILDING_KINDS.filter((kind) => data.buildingCounts[kind] > 0);

  return (
    <section className={styles.panel} aria-label="Layers">
      <header className={styles.header}>
        <h2 className={styles.title}>Layers</h2>
        <Button size="sm" variant="ghost" aria-expanded={open} aria-controls={bodyId} onPress={() => setOpen(!open)}>
          {open ? "Hide" : "Show"}
        </Button>
      </header>
      {open && (
        <div id={bodyId} className={styles.body}>
          {LAYER_GROUPS.map((group) => (
            <div key={group} role="group" aria-label={LAYER_GROUP_LABELS[group]} className={styles.group}>
              <h3 className={styles.groupTitle}>{LAYER_GROUP_LABELS[group]}</h3>
              {LAYERS.filter((definition) => definition.group === group).map((definition) => {
                const count = data.counts[definition.id];
                const parentOff = definition.parent !== null && !layers[definition.parent];
                return (
                  <LayerToggle
                    key={definition.id}
                    label={definition.label}
                    swatch={<LayerSwatch definition={definition} />}
                    isSelected={layers[definition.id]}
                    isDisabled={count === 0 || parentOff}
                    onChange={(on) => onLayerChange(definition.id, on)}
                    count={count ?? null}
                    note={layerNote(definition, count, layers[definition.id], zoom)}
                    nested={definition.parent !== null}
                  />
                );
              })}
              {group === "buildings" &&
                presentKinds.map((kind) => (
                  <LayerToggle
                    key={kind}
                    label={BUILDING_STYLES[kind].label}
                    swatch={<BuildingSwatch kind={kind} />}
                    isSelected={buildingKinds[kind]}
                    isDisabled={!layers.buildings}
                    onChange={(on) => onBuildingKindChange(kind, on)}
                    count={data.buildingCounts[kind]}
                    nested
                  />
                ))}
            </div>
          ))}
          <Legend />
        </div>
      )}
    </section>
  );
}
