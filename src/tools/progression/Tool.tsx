import { useMemo, useState } from "react";
import { useCatalog, type Catalog } from "@/core/catalog";
import { useGameDataMany, type ChallengeRewardsFile, type MetaFile, type Role } from "@/core/data";
import { useStoredState } from "@/core/state";
import { useWeaponIndex, type WeaponIndex } from "@/core/weapons";
import { Button, DataStateView, Dialog, Tab, TabList, TabPanel, Tabs } from "@/ui";
import { EarningRates } from "./components/EarningRates";
import { GoalsPanel } from "./components/GoalsPanel";
import { PlanSummary } from "./components/PlanSummary";
import { ProgressPanel } from "./components/ProgressPanel";
import { RoleLadder } from "./components/RoleLadder";
import { gatedItems } from "./model/goals";
import { killHints } from "./model/killHints";
import { planSummary } from "./model/plan";
import { addGoals, progressStore, removeGoal, resolveProgress, setGoalUnlocked, withRoleLevel } from "./model/progress";
import styles from "./Tool.module.css";

const FILES = ["roles", "meta", "challengeRewards"] as const;

interface PlannerProps {
  roles: readonly Role[];
  meta: MetaFile;
  challengeRewards: ChallengeRewardsFile;
  catalog: Catalog;
  weaponIndex: WeaponIndex;
}

function Planner({ roles, meta, challengeRewards, catalog, weaponIndex }: PlannerProps) {
  const [stored, setStored] = useStoredState(progressStore);
  const [includePurchase, setIncludePurchase] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const gated = useMemo(() => gatedItems(catalog), [catalog]);
  const hints = useMemo(() => killHints(challengeRewards), [challengeRewards]);
  const progress = resolveProgress(stored, roles, meta);
  const plan = planSummary(progress, catalog, roles, gated, { includePurchase });
  const goalIds = plan.goals.map((goal) => goal.item.id);

  return (
    <div className={styles.tool}>
      <div className={styles.toolbar}>
        <Button variant="danger" size="sm" onPress={() => setIsResetting(true)}>
          Reset everything
        </Button>
      </div>
      <Tabs>
        <TabList aria-label="Progression views">
          <Tab id="plan">Plan</Tab>
          <Tab id="ladder">Role ladder</Tab>
        </TabList>
        <TabPanel id="plan">
          <div className={styles.columns}>
            <div className={styles.column}>
              <ProgressPanel
                progress={progress}
                roles={roles}
                catalog={catalog}
                onRoleLevelChange={(role, level) => setStored((prev) => withRoleLevel(prev, role, level))}
                onCareerLevelChange={(careerLevel) => setStored((prev) => ({ ...prev, careerLevel }))}
                onCashChange={(cash) => setStored((prev) => ({ ...prev, cash }))}
              />
              <EarningRates
                rates={progress.rates}
                hints={hints}
                onChange={(rates) => setStored((prev) => ({ ...prev, rates }))}
              />
            </div>
            <div className={styles.column}>
              <GoalsPanel
                goals={plan.goals}
                gated={gated}
                roles={roles}
                catalog={catalog}
                weaponIndex={weaponIndex}
                onAdd={(ids) => setStored((prev) => addGoals(prev, ids))}
                onRemove={(id) => setStored((prev) => removeGoal(prev, id))}
                onUnlockedChange={(id, unlocked) => setStored((prev) => setGoalUnlocked(prev, id, unlocked))}
                onClear={() => setStored((prev) => ({ ...prev, goals: [] }))}
              />
              {plan.goals.length > 0 && (
                <PlanSummary
                  plan={plan}
                  includePurchase={includePurchase}
                  onIncludePurchaseChange={setIncludePurchase}
                />
              )}
            </div>
          </div>
        </TabPanel>
        <TabPanel id="ladder">
          <RoleLadder
            gated={gated}
            roles={roles}
            catalog={catalog}
            levels={progress.roles}
            goalIds={goalIds}
            onAddGoal={(id) => setStored((prev) => addGoals(prev, [id]))}
          />
        </TabPanel>
      </Tabs>
      <Dialog
        title="Reset everything?"
        role="alertdialog"
        size="sm"
        isOpen={isResetting}
        onOpenChange={setIsResetting}
        actions={(close) => (
          <>
            <Button variant="ghost" onPress={close}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onPress={() => {
                progressStore.clear();
                close();
              }}
            >
              Reset
            </Button>
          </>
        )}
      >
        This clears your levels, cash, goals and earning rates.
      </Dialog>
    </div>
  );
}

export default function Tool() {
  const files = useGameDataMany(FILES);
  const catalog = useCatalog();
  const weaponIndex = useWeaponIndex();
  return (
    <DataStateView state={files}>
      {(data) => (
        <DataStateView state={catalog}>
          {(loadedCatalog) => (
            <DataStateView state={weaponIndex}>
              {(index) => (
                <Planner
                  roles={data.roles.roles}
                  meta={data.meta}
                  challengeRewards={data.challengeRewards}
                  catalog={loadedCatalog}
                  weaponIndex={index}
                />
              )}
            </DataStateView>
          )}
        </DataStateView>
      )}
    </DataStateView>
  );
}
