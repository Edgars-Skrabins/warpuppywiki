import type { Catalog } from "@/core/catalog";
import type { Role } from "@/core/data";
import { formatNumber, Grid, NumberField, Panel } from "@/ui";
import { xpAtLevel } from "../model/plan";
import { MAX_CAREER_LEVEL, MAX_ROLE_LEVEL, type ResolvedProgress } from "../model/progress";
import styles from "./ProgressPanel.module.css";

export interface ProgressPanelProps {
  progress: ResolvedProgress;
  roles: readonly Role[];
  catalog: Catalog;
  onRoleLevelChange: (role: string, level: number) => void;
  onCareerLevelChange: (level: number) => void;
  onCashChange: (cash: number) => void;
}

function wholeNumber(value: number, max = Infinity): number {
  return Number.isNaN(value) ? 0 : Math.min(max, Math.max(0, Math.round(value)));
}

export function ProgressPanel({
  progress,
  roles,
  catalog,
  onRoleLevelChange,
  onCareerLevelChange,
  onCashChange,
}: ProgressPanelProps) {
  return (
    <Panel title="Your progress" description="Saved in this browser.">
      <div className={styles.body}>
        <Grid minColumnWidth={160} gap={3}>
          {roles.map((role) => {
            const level = progress.roles[role.id] ?? 0;
            return (
              <NumberField
                key={role.id}
                label={`${catalog.roleLabel(role.id)} level`}
                minValue={0}
                maxValue={MAX_ROLE_LEVEL}
                value={level}
                onChange={(value) => onRoleLevelChange(role.id, wholeNumber(value, MAX_ROLE_LEVEL))}
                description={`${formatNumber(xpAtLevel(role, level))} XP`}
              />
            );
          })}
        </Grid>
        <Grid minColumnWidth={160} gap={3}>
          <NumberField
            label="Career level"
            minValue={0}
            maxValue={MAX_CAREER_LEVEL}
            value={progress.careerLevel}
            onChange={(value) => onCareerLevelChange(wholeNumber(value, MAX_CAREER_LEVEL))}
            description="Only used for career unlocks."
          />
          <NumberField
            label="Cash"
            minValue={0}
            value={progress.cash}
            onChange={(value) => onCashChange(wholeNumber(value))}
            formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
            hideStepper
          />
        </Grid>
      </div>
    </Panel>
  );
}
