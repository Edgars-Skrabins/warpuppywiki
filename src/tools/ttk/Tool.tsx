import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { useLatestBuild } from "@/core/data";
import { encodeState, useUrlState } from "@/core/state";
import { DataStateView, EmptyState, Tab, TabList, TabPanel, Tabs } from "@/ui";
import { caliberTextFor } from "./caliberText";
import { Compare } from "./Compare";
import { LinkToolbar } from "./components/LinkToolbar";
import { MatchupPanel } from "./components/MatchupPanel";
import { Results } from "./components/Results";
import { armorOptions, buildScenario, type MatchupSources } from "./logic/buildScenario";
import { seedComparison } from "./logic/compareResults";
import { distanceSeries } from "./logic/distanceSeries";
import { singleUrl } from "./shareUrl";
import { DEFAULT_MATCHUP, compareCodec, matchupCodec, type MatchupState } from "./state";
import styles from "./Tool.module.css";
import { useMatchupSources } from "./useMatchupSources";

const MODE_PARAM = "mode";
const COMPARE_MODE = "compare";

type Mode = "single" | "compare";

interface CalculatorProps {
  sources: MatchupSources;
  build: string;
  state: MatchupState;
  setState: (next: (previous: MatchupState) => MatchupState) => void;
  decodeError: boolean;
}

function Calculator({ sources, build, state, setState, decodeError }: CalculatorProps) {
  const stored = useMemo(() => buildScenario(state, state, sources), [state, sources]);
  const unknownWeapon = !stored.ok && stored.error === "unknown-weapon";
  const shown = useMemo(
    () => (unknownWeapon ? { ...state, weaponId: DEFAULT_MATCHUP.weaponId } : state),
    [unknownWeapon, state],
  );
  const result = useMemo(
    () => (unknownWeapon ? buildScenario(shown, shown, sources) : stored),
    [unknownWeapon, shown, sources, stored],
  );

  const seriesKey = JSON.stringify({ ...shown, distance: 0 });
  const series = useMemo(() => {
    const atZero = JSON.parse(seriesKey) as MatchupState;
    const built = buildScenario(atZero, atZero, sources);
    return built.ok ? distanceSeries(built.scenario) : null;
  }, [seriesKey, sources]);

  const armor = useMemo(() => armorOptions(sources.equipment, sources.catalog), [sources]);
  const caliberText = useMemo(() => caliberTextFor(sources.catalog), [sources]);

  if (result.matchup === null) {
    return <EmptyState title="No weapons in the game data" />;
  }

  const notices = [
    ...(decodeError ? ["This link couldn't be read; showing defaults"] : []),
    ...(unknownWeapon ? ["This weapon is not in the game data; showing the default"] : []),
  ];

  return (
    <div className={styles.tool}>
      <aside className={styles.panel}>
        <MatchupPanel
          state={shown}
          matchup={result.matchup}
          weapons={sources.index.playerWeapons}
          armor={armor}
          caliberText={caliberText}
          onChange={(patch) => setState((previous) => ({ ...previous, ...patch }))}
        />
      </aside>
      <section className={styles.results} aria-label="Results">
        <LinkToolbar notices={notices} getUrl={() => singleUrl(state)} resetKey={JSON.stringify(state)} />
        {result.ok ? (
          <Results
            scenario={result.scenario}
            matchup={result.matchup}
            sources={sources}
            series={series}
            build={build}
          />
        ) : result.error === "no-zones" ? (
          <EmptyState title="Pick at least one hit zone" />
        ) : (
          <EmptyState title="No projectile data for this ammo" />
        )}
      </section>
    </div>
  );
}

interface TtkViewProps {
  sources: MatchupSources;
  build: string;
}

function TtkView({ sources, build }: TtkViewProps) {
  const [params, setParams] = useSearchParams();
  const [single, setSingle, { decodeError }] = useUrlState(matchupCodec);
  const mode: Mode = params.get(MODE_PARAM) === COMPARE_MODE ? "compare" : "single";

  function changeMode(next: Mode) {
    if (next === mode) return;
    setParams(
      (previous) => {
        const result = new URLSearchParams(previous);
        if (next === "compare") {
          result.set(MODE_PARAM, COMPARE_MODE);
          if (!result.has(compareCodec.key)) {
            result.set(compareCodec.key, encodeState(compareCodec, seedComparison(single, sources)));
          }
        } else {
          result.delete(MODE_PARAM);
        }
        return result;
      },
      { replace: true },
    );
  }

  return (
    <Tabs
      selectedKey={mode}
      onSelectionChange={(key) => {
        if (key === "single" || key === "compare") changeMode(key);
      }}
    >
      <TabList aria-label="Mode" className={styles.tabs}>
        <Tab id="single">Single</Tab>
        <Tab id="compare">Compare</Tab>
      </TabList>
      <TabPanel id="single">
        <Calculator sources={sources} build={build} state={single} setState={setSingle} decodeError={decodeError} />
      </TabPanel>
      <TabPanel id="compare">
        <Compare sources={sources} />
      </TabPanel>
    </Tabs>
  );
}

export default function Tool() {
  const sources = useMatchupSources();
  const build = useLatestBuild();
  return (
    <DataStateView state={sources}>
      {(data) => <TtkView sources={data} build={build.status === "success" ? build.data : ""} />}
    </DataStateView>
  );
}
