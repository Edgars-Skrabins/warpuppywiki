import { useMemo } from "react";
import { useUrlState } from "@/core/state";
import { EmptyState, Panel } from "@/ui";
import { caliberTextFor } from "./caliberText";
import { CompareCharts, type CompareSeries } from "./components/CompareCharts";
import { ComparePanel, SetupList } from "./components/ComparePanel";
import { CompareTable } from "./components/CompareTable";
import { LinkToolbar } from "./components/LinkToolbar";
import { armorOptions, buildScenario, findArmor, type MatchupSources } from "./logic/buildScenario";
import { addSetup, compareResults, duplicateSetup, removeSetup, updateSetup } from "./logic/compareResults";
import { distanceSeries } from "./logic/distanceSeries";
import { compareUrl } from "./shareUrl";
import { compareCodec, type CompareState, type SharedTargetState } from "./state";
import styles from "./Tool.module.css";

export interface CompareProps {
  sources: MatchupSources;
}

export function Compare({ sources }: CompareProps) {
  const [state, setState, { decodeError }] = useUrlState(compareCodec);
  const rows = useMemo(() => compareResults(state, sources), [state, sources]);
  const armor = useMemo(() => armorOptions(sources.equipment, sources.catalog), [sources]);
  const caliberText = useMemo(() => caliberTextFor(sources.catalog), [sources]);
  const worn = [findArmor(armor.body, state.shared.bodyArmorId), findArmor(armor.helmets, state.shared.helmetId)];

  const chartKey = JSON.stringify({
    state: { ...state, shared: { ...state.shared, distance: 0 } },
    rows: rows.filter((row) => row.status === "ok").map((row) => ({ index: row.index, label: row.label })),
  });
  const series = useMemo<CompareSeries[]>(() => {
    const chart = JSON.parse(chartKey) as { state: CompareState; rows: { index: number; label: string }[] };
    return chart.rows.flatMap((row) => {
      const setup = chart.state.setups[row.index];
      const result = setup === undefined ? null : buildScenario(chart.state.shared, setup, sources);
      return result?.ok ? [{ index: row.index, label: row.label, points: distanceSeries(result.scenario) }] : [];
    });
  }, [chartKey, sources]);

  function updateShared(patch: Partial<SharedTargetState>) {
    setState((previous) => ({ ...previous, shared: { ...previous.shared, ...patch } }));
  }

  const noZones = rows.every((row) => row.status === "no-zones");

  return (
    <div className={styles.tool}>
      <aside className={styles.panel}>
        <ComparePanel
          shared={state.shared}
          armor={armor}
          worn={worn}
          hasShotgun={rows.some((row) => row.result.matchup?.isShotgun === true)}
          onChange={updateShared}
        />
      </aside>
      <section className={styles.results} aria-label="Comparison results">
        <LinkToolbar
          notices={decodeError ? ["This link couldn't be read; showing defaults"] : []}
          getUrl={() => compareUrl(state)}
          resetKey={JSON.stringify(state)}
        />
        <SetupList
          rows={rows}
          weapons={sources.index.playerWeapons}
          caliberText={caliberText}
          onChange={(index, patch) => setState((previous) => updateSetup(previous, index, patch))}
          onAdd={() => setState(addSetup)}
          onDuplicate={(index) => setState((previous) => duplicateSetup(previous, index))}
          onRemove={(index) => setState((previous) => removeSetup(previous, index))}
        />
        {noZones ? (
          <EmptyState title="Pick at least one hit zone" />
        ) : (
          <>
            <Panel title="Results" headingLevel={2}>
              <CompareTable rows={rows} />
            </Panel>
            <CompareCharts series={series} distance={state.shared.distance} />
          </>
        )}
      </section>
    </div>
  );
}
