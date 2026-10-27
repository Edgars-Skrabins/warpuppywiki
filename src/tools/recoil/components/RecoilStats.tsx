import { formatNumber, formatSeconds, formatMultiplier, StatRow, EMPTY_VALUE } from "@/ui";
import type { Range } from "../logic/recoilPath";
import type { RecoilStatsSummary } from "../logic/recoilStats";
import styles from "./RecoilStats.module.css";

export interface RecoilStatsProps {
  stats: RecoilStatsSummary;
}

function formatSigned(n: number): string {
  return n > 0 ? `+${formatNumber(n)}` : formatNumber(n);
}

function formatRange(range: Range | null): string {
  return range === null ? EMPTY_VALUE : `${formatSigned(range[0])} to ${formatSigned(range[1])}`;
}

export function RecoilStats({ stats }: RecoilStatsProps) {
  return (
    <div className={styles.stats}>
      <StatRow label="Pattern length" value={formatNumber(stats.patternLength)} unit="shots" />
      <StatRow label="Total vertical climb" value={formatNumber(stats.verticalClimb)} />
      <StatRow
        label="Total horizontal drift"
        value={formatSigned(stats.horizontalDrift)}
        hint={`max ${formatNumber(stats.maxSideways)} from centre`}
      />
      <StatRow label="Pattern reset time" value={formatSeconds(stats.patternResetTime)} />
      <StatRow label="View kick" value={formatMultiplier(stats.viewKickMultiplier)} />
      <StatRow label="After pattern, vertical per shot" value={formatRange(stats.afterPatternPitch)} />
      <StatRow label="After pattern, horizontal per shot" value={formatRange(stats.afterPatternYaw)} />
    </div>
  );
}
