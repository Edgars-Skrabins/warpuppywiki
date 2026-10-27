import { useMemo } from "react";
import { hitLocationLabel, simulateKill, weaponDamageTag, type DistancePoint, type Scenario } from "@/core/damage";
import { Badge, EmptyState, Panel } from "@/ui";
import type { MatchupSources, ResolvedMatchup } from "../logic/buildScenario";
import type { RuleContext } from "../logic/describeRule";
import { DistanceCharts } from "./DistanceCharts";
import { ModelNotes } from "./ModelNotes";
import { ResultCards } from "./ResultCards";
import styles from "./Results.module.css";
import { ShotTable } from "./ShotTable";
import { WhyTable } from "./WhyTable";

export interface ResultsProps {
  scenario: Scenario;
  matchup: ResolvedMatchup;
  sources: MatchupSources;
  series: readonly DistancePoint[] | null;
  build: string;
}

export function Results({ scenario, matchup, sources, series, build }: ResultsProps) {
  const kill = useMemo(() => simulateKill(scenario), [scenario]);
  const context: RuleContext = {
    tagText: (tag) => sources.catalog.tagText(tag),
    weapon: { name: matchup.weapon.name, damageTag: weaponDamageTag(matchup.weapon) },
  };

  if (!kill.supported) {
    return (
      <div className={styles.results}>
        {kill.reason === "explosive" ? (
          <>
            <Badge tone="warning">Not modeled: explosive weapon</Badge>
            <EmptyState title="Explosive weapons are not modeled" />
          </>
        ) : (
          <EmptyState title="No projectile data for this ammo" />
        )}
        <ModelNotes build={build} />
      </div>
    );
  }

  const firstShot = kill.shots[0];
  const firstHit = firstShot?.hits[0];

  return (
    <div className={styles.results}>
      <ResultCards kill={kill} matchup={matchup} body={scenario.target.body} helmet={scenario.target.helmet} />
      {firstShot !== undefined && firstHit !== undefined && (
        <Panel
          title="Why this damage"
          headingLevel={2}
          description={`Shot 1, ${hitLocationLabel(firstShot.location)}${firstShot.hits.length > 1 ? ", one pellet" : ""}`}
        >
          <WhyTable hit={firstHit} rules={sources.damage.rules} context={context} />
        </Panel>
      )}
      <Panel title="Shot by shot" headingLevel={2}>
        <ShotTable shots={kill.shots} />
      </Panel>
      {series !== null && (
        <DistanceCharts
          series={series}
          distance={scenario.distance}
          effectiveRange={matchup.weapon.stats.effectiveRange ?? null}
        />
      )}
      <ModelNotes build={build} />
    </div>
  );
}
