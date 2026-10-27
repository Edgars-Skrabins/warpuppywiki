import { HIT_LOCATIONS, type HitLocation } from "@/core/damage";
import type { PlayerWeapon } from "@/core/weapons";
import { NumberField, Panel, Select, Slider, formatDistance } from "@/ui";
import type { ArmorOptions, ResolvedMatchup } from "../logic/buildScenario";
import { MAX_DISTANCE, type MatchupState } from "../state";
import { AmmoPicker } from "./AmmoPicker";
import styles from "./MatchupPanel.module.css";
import { PlacementPicker } from "./PlacementPicker";
import { TargetPanel } from "./TargetPanel";
import { WeaponPicker } from "./WeaponPicker";

export interface MatchupPanelProps {
  state: MatchupState;
  matchup: ResolvedMatchup;
  weapons: readonly PlayerWeapon[];
  armor: ArmorOptions;
  caliberText: (weapon: PlayerWeapon) => string;
  onChange: (patch: Partial<MatchupState>) => void;
}

function coveredLocations(matchup: ResolvedMatchup): ReadonlySet<HitLocation> {
  const covered = [matchup.bodyArmor, matchup.helmet].flatMap((armor) => armor?.coveredLocations ?? []);
  return new Set(HIT_LOCATIONS.map((info) => info.location).filter((location) => covered.includes(location)));
}

function customZones(custom: readonly string[]): HitLocation[] {
  return custom.filter((zone): zone is HitLocation => HIT_LOCATIONS.some((info) => info.location === zone));
}

export function MatchupPanel({ state, matchup, weapons, armor, caliberText, onChange }: MatchupPanelProps) {
  return (
    <div className={styles.panel}>
      <Panel title="Matchup" headingLevel={2}>
        <div className={styles.group}>
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
          <div className={styles.distance}>
            <Slider
              label="Distance"
              minValue={0}
              maxValue={MAX_DISTANCE}
              step={5}
              value={state.distance}
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
              value={state.distance}
              onChange={(distance) => {
                if (Number.isFinite(distance)) onChange({ distance });
              }}
            />
          </div>
          <PlacementPicker
            placement={state.placement}
            custom={customZones(state.custom)}
            covered={coveredLocations(matchup)}
            onPlacementChange={(placement) => onChange({ placement })}
            onCustomChange={(custom) => onChange({ custom })}
          />
        </div>
      </Panel>
      <Panel title="Target" headingLevel={2}>
        <TargetPanel state={state} armor={armor} onChange={onChange} />
        {matchup.isShotgun && (
          <NumberField
            label="Pellets that hit per shot"
            minValue={1}
            maxValue={20}
            step={1}
            value={state.pellets}
            description="Pellet count is not in the game files."
            onChange={(pellets) => {
              if (Number.isFinite(pellets)) onChange({ pellets });
            }}
          />
        )}
      </Panel>
    </div>
  );
}
