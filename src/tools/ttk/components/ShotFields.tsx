import { HIT_LOCATIONS, type HitLocation } from "@/core/damage";
import type { Armor } from "@/core/data";
import { NumberField, Slider, formatDistance } from "@/ui";
import { MAX_DISTANCE, type SharedTargetState } from "../state";
import styles from "./MatchupPanel.module.css";
import { PlacementPicker } from "./PlacementPicker";

export interface ShotFieldsProps {
  shared: SharedTargetState;
  worn: readonly (Armor | null)[];
  onChange: (patch: Partial<SharedTargetState>) => void;
}

function coveredLocations(worn: readonly (Armor | null)[]): ReadonlySet<HitLocation> {
  const covered = worn.flatMap((armor) => armor?.coveredLocations ?? []);
  return new Set(HIT_LOCATIONS.map((info) => info.location).filter((location) => covered.includes(location)));
}

function customZones(custom: readonly string[]): HitLocation[] {
  return custom.filter((zone): zone is HitLocation => HIT_LOCATIONS.some((info) => info.location === zone));
}

export function ShotFields({ shared, worn, onChange }: ShotFieldsProps) {
  return (
    <>
      <div className={styles.distance}>
        <Slider
          label="Distance"
          minValue={0}
          maxValue={MAX_DISTANCE}
          step={5}
          value={shared.distance}
          formatValue={formatDistance}
          onChange={(distance) => onChange({ distance })}
        />
        <NumberField
          label="Distance in meters"
          hideLabel
          hideStepper
          unit="m"
          minValue={0}
          maxValue={MAX_DISTANCE}
          step={5}
          value={shared.distance}
          onChange={(distance) => {
            if (Number.isFinite(distance)) onChange({ distance });
          }}
        />
      </div>
      <PlacementPicker
        placement={shared.placement}
        custom={customZones(shared.custom)}
        covered={coveredLocations(worn)}
        onPlacementChange={(placement) => onChange({ placement })}
        onCustomChange={(custom) => onChange({ custom })}
      />
    </>
  );
}
