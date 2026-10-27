import type { Weapon } from "@/core/data";
import { EMPTY_VALUE, formatDistance, formatMultiplier, formatNumber, formatSeconds, StatRow } from "@/ui";
import { formatList, formatZeroing } from "./formatValue";
import styles from "./WeaponDetail.module.css";

export interface StatsGridProps {
  stats: Weapon;
}

function withUnit(value: number | null | undefined, unit: string): string {
  return value === null || value === undefined ? EMPTY_VALUE : `${formatNumber(value)} ${unit}`;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className={styles.statColumns}>
      <div>
        <StatRow label="Fire modes" value={formatList(stats.fireModes)} />
        <StatRow label="Fire rate" value={withUnit(stats.rpm, "RPM")} />
        <StatRow label="Rounds per burst" value={formatNumber(stats.roundsPerBurst)} />
        <StatRow label="Windup" value={formatSeconds(stats.windupTime)} />
        <StatRow label="Muzzle velocity" value={withUnit(stats.muzzleVelocity, "m/s")} />
        <StatRow label="Effective range" value={formatDistance(stats.effectiveRange)} />
      </div>
      <div>
        <StatRow label="Accuracy rating" value={formatNumber(stats.accuracy)} hint="Compare within a class" />
        <StatRow label="Random deviation" value={formatNumber(stats.randomDeviation)} />
        <StatRow label="ADS time" value={formatSeconds(stats.adsTime)} />
        <StatRow label="Zeroing range" value={formatZeroing(stats.zeroing)} />
        <StatRow label="Melee damage" value={formatNumber(stats.meleeDamage)} />
        <StatRow label="Suppression" value={formatMultiplier(stats.suppressionMultiplier)} />
      </div>
    </div>
  );
}
