import { useMemo } from "react";
import { useUrlState } from "@/core/state";
import { useWeaponIndex, type WeaponIndex } from "@/core/weapons";
import { Button, DataStateView, EmptyState, Panel, SegmentedControl, formatDistance } from "@/ui";
import { BallisticsInputs } from "./components/BallisticsInputs";
import { BallisticsNotes, type DragModelNote } from "./components/BallisticsNotes";
import { FlightTimeChart } from "./components/FlightTimeChart";
import { RangeCardTable } from "./components/RangeCardTable";
import type { ChartSetup } from "./components/chartData";
import { TrajectoryChart } from "./components/TrajectoryChart";
import {
  MAX_DISTANCES,
  ballisticWeapons,
  computeSetup,
  defaultMaxDistance,
  resolveSetup,
  type MaxDistance,
  type SetupResult,
} from "./logic/setup";
import { EMPTY_SETUP, ballisticsState } from "./state";
import styles from "./Tool.module.css";

const NO_DATA = "Not enough ballistic data for this projectile";

function chartSetup(key: string, label: string, result: SetupResult): ChartSetup {
  return { key, label: `${label} · ${result.setup.weapon.name}`, samples: result.samples, zero: result.setup.zero };
}

function dragNote(label: string, result: SetupResult): DragModelNote | null {
  if (!result.projectile) return null;
  return { label, sourceModel: result.setup.ammo.projectile?.drag?.model ?? null, model: result.projectile.dragModel };
}

function Ballistics({ index }: { index: WeaponIndex }) {
  const [state, setState] = useUrlState(ballisticsState);
  const weapons = useMemo(() => ballisticWeapons(index), [index]);
  const primarySetup = useMemo(() => resolveSetup(index, state.primary), [index, state.primary]);
  const comparisonSetup = useMemo(
    () => (state.comparison ? resolveSetup(index, state.comparison) : null),
    [index, state.comparison],
  );
  const maxDistance: MaxDistance = state.maxDistance ?? defaultMaxDistance(primarySetup?.weapon ?? null);
  const primary = useMemo(
    () => (primarySetup ? computeSetup(primarySetup, maxDistance) : null),
    [primarySetup, maxDistance],
  );
  const comparison = useMemo(
    () => (comparisonSetup ? computeSetup(comparisonSetup, maxDistance) : null),
    [comparisonSetup, maxDistance],
  );

  if (!primarySetup || !primary) {
    return <EmptyState title="No weapons with ballistic data" text="This game build has no bullet weapons to show." />;
  }

  const results = [
    { key: "a", label: "A", result: primary },
    ...(comparison ? [{ key: "b", label: "B", result: comparison }] : []),
  ];
  const charted = results.filter(({ result }) => result.projectile);
  const dragModels = results.flatMap(({ label, result }) => {
    const note = dragNote(label, result);
    return note ? [note] : [];
  });
  const comparisonRows = comparison?.projectile ? comparison.rows : undefined;

  return (
    <div className={styles.tool}>
      <Panel
        title="Setup"
        actions={
          <SegmentedControl
            aria-label="Maximum distance"
            options={MAX_DISTANCES.map((distance) => ({ id: String(distance), label: formatDistance(distance) }))}
            value={String(maxDistance)}
            onChange={(value) => setState((prev) => ({ ...prev, maxDistance: Number(value) as MaxDistance }))}
            size="sm"
          />
        }
      >
        <div className={styles.setups}>
          <BallisticsInputs
            label="A"
            weapons={weapons}
            setup={primarySetup}
            onChange={(selection) => setState((prev) => ({ ...prev, primary: selection }))}
          />
          {comparisonSetup ? (
            <div className={styles.comparison}>
              <BallisticsInputs
                label="B"
                weapons={weapons}
                setup={comparisonSetup}
                onChange={(selection) => setState((prev) => ({ ...prev, comparison: selection }))}
              />
              <Button variant="ghost" size="sm" onPress={() => setState((prev) => ({ ...prev, comparison: null }))}>
                Remove comparison
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className={styles.add}
              onPress={() =>
                setState((prev) => ({ ...prev, comparison: { ...EMPTY_SETUP, weapon: primarySetup.weapon.id } }))
              }
            >
              Add comparison
            </Button>
          )}
        </div>
      </Panel>

      {results
        .filter(({ result }) => !result.projectile)
        .map(({ key, label, result }) => (
          <EmptyState
            key={key}
            title={NO_DATA}
            text={`${label}: ${result.setup.ammo.item.name ?? result.setup.ammo.item.id}`}
          />
        ))}

      {charted.length > 0 && (
        <>
          <div className={styles.charts}>
            <TrajectoryChart setups={charted.map(({ key, label, result }) => chartSetup(key, label, result))} />
            <FlightTimeChart setups={charted.map(({ key, label, result }) => chartSetup(key, label, result))} />
          </div>
          <Panel title="Range card" description="Approximate values at each distance for the chosen zero.">
            <RangeCardTable
              rows={primary.projectile ? primary.rows : (comparison?.rows ?? [])}
              comparison={primary.projectile ? comparisonRows : undefined}
            />
          </Panel>
        </>
      )}

      <BallisticsNotes dragModels={dragModels} />
    </div>
  );
}

export default function Tool() {
  const state = useWeaponIndex();
  return <DataStateView state={state}>{(index) => <Ballistics index={index} />}</DataStateView>;
}
