import { Badge, formatCash, formatNumber, Panel, StatBar, StatRow, Switch } from "@/ui";
import type { PlanSummary as Plan } from "../model/plan";
import styles from "./PlanSummary.module.css";

export interface PlanSummaryProps {
  plan: Plan;
  includePurchase: boolean;
  onIncludePurchaseChange: (include: boolean) => void;
}

function matchesText(matches: number | null): string | undefined {
  return matches === null ? undefined : `≈ ${formatNumber(matches)} ${matches === 1 ? "match" : "matches"}`;
}

export function PlanSummary({ plan, includePurchase, onIncludePurchaseChange }: PlanSummaryProps) {
  const targetRoles = plan.roles.filter((role) => role.targetLevel !== null);
  const hasMatchEstimates = targetRoles.some((role) => role.matches !== null);

  return (
    <Panel title="Plan">
      <div className={styles.body}>
        <section className={styles.section} aria-label="Role XP">
          <h3 className={styles.heading}>Role XP</h3>
          {targetRoles.length === 0 ? (
            <p className={styles.note}>No role unlocks in your goals.</p>
          ) : (
            targetRoles.map((role) => (
              <div key={role.role} className={styles.role}>
                <StatRow
                  label={`${role.label} level ${role.currentLevel} → ${role.targetLevel}`}
                  value={role.xpNeeded === 0 ? "Reached" : `${formatNumber(role.xpNeeded)} XP needed`}
                  hint={matchesText(role.matches)}
                />
                <StatBar
                  label={`${role.label} XP`}
                  value={Math.min(role.currentXp, role.targetXp ?? 0)}
                  max={Math.max(role.targetXp ?? 0, 1)}
                  format={(value) => `${formatNumber(value)} / ${formatNumber(role.targetXp)} XP`}
                  tone={role.xpNeeded === 0 ? "success" : "neutral"}
                />
              </div>
            ))
          )}
          {hasMatchEstimates && (
            <p className={styles.note}>
              Role XP goes to the role you play, so each estimate assumes you play that role.
            </p>
          )}
        </section>

        <section className={styles.section} aria-label="Career">
          <h3 className={styles.heading}>Career</h3>
          {plan.career.requiredLevel === null ? (
            <p className={styles.note}>No career unlocks in your goals.</p>
          ) : (
            <StatRow
              label={`Career level ${plan.career.requiredLevel} needed`}
              value={
                <Badge tone={plan.career.reached ? "success" : "neutral"}>
                  {plan.career.reached ? "Reached" : "Not reached"}
                </Badge>
              }
            />
          )}
          <p className={styles.note}>The game doesn't publish how career level grows, so no XP estimate.</p>
        </section>

        <section className={styles.section} aria-label="Cash">
          <h3 className={styles.heading}>Cash</h3>
          <StatRow label="Unlock costs" value={formatCash(plan.cash.unlockCost)} />
          {includePurchase && <StatRow label="Buying one of each" value={formatCash(plan.cash.purchaseCost)} />}
          <StatRow label="Cash on hand" value={formatCash(plan.cash.available)} />
          <StatRow
            label="Cash still needed"
            value={formatCash(plan.cash.needed)}
            hint={matchesText(plan.cash.matches)}
          />
          <Switch isSelected={includePurchase} onChange={onIncludePurchaseChange}>
            Include buying one of each
          </Switch>
        </section>
      </div>
    </Panel>
  );
}
