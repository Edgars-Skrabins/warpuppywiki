import { useMemo, useState } from "react";
import { useLatestBuild } from "@/core/data";
import { encodeState, useUrlState } from "@/core/state";
import type { PlayerWeapon } from "@/core/weapons";
import { Button, DataStateView, EmptyState } from "@/ui";
import { MatchupPanel } from "./components/MatchupPanel";
import { Results } from "./components/Results";
import { armorOptions, buildScenario, type MatchupSources } from "./logic/buildScenario";
import { distanceSeries } from "./logic/distanceSeries";
import { DEFAULT_MATCHUP, matchupCodec, type MatchupState } from "./state";
import styles from "./Tool.module.css";
import { useMatchupSources } from "./useMatchupSources";

function shareUrl(state: MatchupState): string {
  return `${window.location.origin}${window.location.pathname}#/ttk?m=${encodeState(matchupCodec, state)}`;
}

interface CalculatorProps {
  sources: MatchupSources;
  build: string;
}

function Calculator({ sources, build }: CalculatorProps) {
  const [state, setState, { decodeError }] = useUrlState(matchupCodec);
  const [copied, setCopied] = useState(false);

  const stored = useMemo(() => buildScenario(state, sources), [state, sources]);
  const unknownWeapon = !stored.ok && stored.error === "unknown-weapon";
  const shown = useMemo(
    () => (unknownWeapon ? { ...state, weaponId: DEFAULT_MATCHUP.weaponId } : state),
    [unknownWeapon, state],
  );
  const result = useMemo(
    () => (unknownWeapon ? buildScenario(shown, sources) : stored),
    [unknownWeapon, shown, sources, stored],
  );

  const seriesKey = JSON.stringify({ ...shown, distance: 0 });
  const series = useMemo(() => {
    const atZero = buildScenario(JSON.parse(seriesKey) as MatchupState, sources);
    return atZero.ok ? distanceSeries(atZero.scenario) : null;
  }, [seriesKey, sources]);

  const armor = useMemo(() => armorOptions(sources.equipment, sources.catalog), [sources]);

  function caliberText(weapon: PlayerWeapon): string {
    return weapon.stats.calibers
      .map((caliber) => sources.catalog.tagText(`Item.Caliber.${caliber}`) ?? caliber)
      .join(", ");
  }

  function update(patch: Partial<MatchupState>) {
    setCopied(false);
    setState((previous) => ({ ...previous, ...patch }));
  }

  function copyLink() {
    void navigator.clipboard.writeText(shareUrl(state)).then(() => setCopied(true));
  }

  if (result.matchup === null) {
    return <EmptyState title="No weapons in the game data" />;
  }

  return (
    <div className={styles.tool}>
      <aside className={styles.panel}>
        <MatchupPanel
          state={shown}
          matchup={result.matchup}
          weapons={sources.index.playerWeapons}
          armor={armor}
          caliberText={caliberText}
          onChange={update}
        />
      </aside>
      <section className={styles.results} aria-label="Results">
        <div className={styles.toolbar}>
          <div className={styles.notices} role="status">
            {decodeError && <p className={styles.notice}>This link couldn&apos;t be read; showing defaults</p>}
            {unknownWeapon && <p className={styles.notice}>This weapon is not in the game data; showing the default</p>}
            {copied && <p className={styles.copied}>Link copied</p>}
          </div>
          <Button size="sm" onPress={copyLink}>
            Copy link
          </Button>
        </div>
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

export default function Tool() {
  const sources = useMatchupSources();
  const build = useLatestBuild();
  return (
    <DataStateView state={sources}>
      {(data) => <Calculator sources={data} build={build.status === "success" ? build.data : ""} />}
    </DataStateView>
  );
}
