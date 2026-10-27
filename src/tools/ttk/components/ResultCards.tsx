import type { KillResult, WornPiece } from "@/core/damage";
import { Badge, formatNumber, formatPercent, formatSeconds } from "@/ui";
import type { ResolvedMatchup } from "../logic/buildScenario";
import { shotHealthDamage } from "../logic/shotDamage";
import styles from "./ResultCards.module.css";

type SupportedKill = Extract<KillResult, { supported: true }>;

export interface ResultCardsProps {
  kill: SupportedKill;
  matchup: ResolvedMatchup;
  body: WornPiece | null;
  helmet: WornPiece | null;
}

function ttkReason(kill: SupportedKill, matchup: ResolvedMatchup): string | null {
  if (!kill.killed) return "Target not killed";
  if (kill.needsReload) return "Needs a reload";
  if (kill.ttk === null) return matchup.weapon.stats.rpm ? null : "No fire rate in the game files";
  return null;
}

function armorLeft(piece: WornPiece | null, after: number | null | undefined): string {
  const max = piece?.armor.durability;
  if (piece === null || !max || after === null || after === undefined) return "—";
  return formatPercent(after / max);
}

export function ResultCards({ kill, matchup, body, helmet }: ResultCardsProps) {
  const last = kill.shots.at(-1);
  const reason = ttkReason(kill, matchup);
  const capacity = matchup.magazine?.capacity;
  return (
    <div className={styles.results}>
      <dl className={styles.cards}>
        <div className={styles.card}>
          <dt className={styles.label}>Shots to kill</dt>
          <dd className={styles.value}>{kill.stk === null ? "—" : formatNumber(kill.stk)}</dd>
        </div>
        <div className={styles.card}>
          <dt className={styles.label}>Time to kill</dt>
          <dd className={styles.value}>{kill.ttk === null ? "—" : formatSeconds(kill.ttk)}</dd>
          {reason !== null && <dd className={styles.detail}>{reason}</dd>}
        </div>
        <div className={styles.card}>
          <dt className={styles.label}>First shot</dt>
          <dd className={styles.value}>{formatNumber(shotHealthDamage(kill.shots[0]), { maxFractionDigits: 1 })}</dd>
          <dd className={styles.detail}>damage to health</dd>
        </div>
        <div className={styles.card}>
          <dt className={styles.label}>Armor left</dt>
          <dd className={styles.pair}>
            <span>
              <span className={styles.pairLabel}>Body</span>
              <span className={styles.pairValue}>{armorLeft(body, last?.bodyDurabilityAfter)}</span>
            </span>
            <span>
              <span className={styles.pairLabel}>Helmet</span>
              <span className={styles.pairValue}>{armorLeft(helmet, last?.helmetDurabilityAfter)}</span>
            </span>
          </dd>
        </div>
      </dl>
      {(kill.needsReload || !kill.killed) && (
        <div className={styles.warnings}>
          {kill.needsReload && capacity !== undefined && (
            <Badge tone="warning">Needs a reload (magazine holds {formatNumber(capacity)})</Badge>
          )}
          {!kill.killed && <Badge tone="danger">Target not killed within 200 shots</Badge>}
        </div>
      )}
    </div>
  );
}
