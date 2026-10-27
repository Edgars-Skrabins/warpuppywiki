import { useMemo } from "react";
import { normalizeId, sameId } from "@/core/catalog";
import { useGameDataMany, type ChallengeRewardsFile, type RewardsFile } from "@/core/data";
import { useUrlState } from "@/core/state";
import { DataStateView, EmptyState, Panel, Tab, TabList, TabPanel, Tabs } from "@/ui";
import { CashTable } from "./components/CashTable";
import { EventPicker } from "./components/EventPicker";
import { ResultCard } from "./components/ResultCard";
import { SituationPanel } from "./components/SituationPanel";
import { calculateReward } from "./model/calculate";
import { situationFields } from "./model/contextTags";
import { curveLookup } from "./model/curves";
import { DEFAULT_EVENT, rewardsState } from "./state";
import styles from "./Tool.module.css";

const FILES = ["challengeRewards", "rewards"] as const;

function RewardCalculator({
  challengeRewards,
  cashRewards,
}: {
  challengeRewards: ChallengeRewardsFile;
  cashRewards: RewardsFile;
}) {
  const [state, setState] = useUrlState(rewardsState);

  const eventFor = useMemo(() => {
    const byId = new Map(challengeRewards.events.map((event) => [normalizeId(event.id), event]));
    return (id: string) => byId.get(normalizeId(id));
  }, [challengeRewards]);
  const curves = useMemo(() => curveLookup(challengeRewards.curves), [challengeRewards]);
  const reward =
    challengeRewards.rewards.find((entry) => sameId(entry.id, state.event)) ??
    challengeRewards.rewards.find((entry) => entry.id === DEFAULT_EVENT) ??
    challengeRewards.rewards[0];
  const fields = useMemo(() => (reward ? situationFields(reward) : null), [reward]);
  const situation = { tags: state.tags, game: state.game, scaling: state.scaling };
  const results = reward ? calculateReward(reward, situation, curves) : [];

  return (
    <Tabs className={styles.tabs}>
      <TabList aria-label="Reward views">
        <Tab id="formulas">Formulas</Tab>
        <Tab id="cash">Cash table</Tab>
      </TabList>
      <TabPanel id="formulas">
        {reward && fields ? (
          <div className={styles.layout}>
            <div className={styles.inputs}>
              <Panel title="Event">
                <EventPicker
                  rewards={challengeRewards.rewards}
                  eventFor={eventFor}
                  selectedId={reward.id}
                  onSelect={(id) => {
                    if (!sameId(id, reward.id)) {
                      setState({ event: id, tags: [], game: {}, scaling: {} });
                    }
                  }}
                />
              </Panel>
              <Panel title="Situation">
                <SituationPanel
                  fields={fields}
                  situation={situation}
                  onChange={(next) => setState((prev) => ({ ...prev, ...next }))}
                />
              </Panel>
            </div>
            <Panel title="Rewards">
              <div className={styles.results}>
                {results.map((result) => (
                  <ResultCard key={result.resource} result={result} />
                ))}
              </div>
            </Panel>
          </div>
        ) : (
          <EmptyState title="No rewards" text="This game build has no reward formulas." />
        )}
      </TabPanel>
      <TabPanel id="cash">
        <CashTable rewards={cashRewards.rewards} />
      </TabPanel>
    </Tabs>
  );
}

export default function Tool() {
  const data = useGameDataMany(FILES);
  return (
    <DataStateView state={data}>
      {(files) => <RewardCalculator challengeRewards={files.challengeRewards} cashRewards={files.rewards} />}
    </DataStateView>
  );
}
