import {
  DataTable,
  formatDistance,
  formatMultiplier,
  formatNumber,
  formatSeconds,
  StatDelta,
  Switch,
  type Column,
  type DeltaKind,
} from "@/ui";
import type { StatFormat, StatRow } from "../model/weaponSetup";
import styles from "./WeaponStatsTable.module.css";

const FORMATTERS: Record<StatFormat, (value: number | null) => string> = {
  seconds: (value) => formatSeconds(value),
  multiplier: (value) => formatMultiplier(value),
  distance: (value) => formatDistance(value),
  number: (value) => formatNumber(value),
};

const DELTA_KINDS: Record<StatFormat, DeltaKind> = {
  seconds: "seconds",
  multiplier: "multiplier",
  distance: "distance",
  number: "number",
};

const COLUMNS: readonly Column<StatRow>[] = [
  { key: "stat", header: "Stat", value: (row) => row.label },
  {
    key: "bare",
    header: "Bare",
    value: (row) => row.bare,
    render: (row) => FORMATTERS[row.format](row.bare),
    align: "end",
  },
  {
    key: "fitted",
    header: "Fitted",
    value: (row) => row.fitted,
    render: (row) => FORMATTERS[row.format](row.fitted),
    align: "end",
  },
  {
    key: "change",
    header: "Change",
    value: (row) => (row.bare === null || row.fitted === null ? null : row.fitted - row.bare),
    render: (row) => (
      <StatDelta from={row.bare} to={row.fitted} betterWhen={row.betterWhen} format={DELTA_KINDS[row.format]} />
    ),
    align: "end",
  },
];

export interface WeaponStatsTableProps {
  rows: readonly StatRow[];
  includeEffects: boolean;
  onIncludeEffectsChange: (include: boolean) => void;
  effectSources: readonly string[];
}

export function WeaponStatsTable({
  rows,
  includeEffects,
  onIncludeEffectsChange,
  effectSources,
}: WeaponStatsTableProps) {
  return (
    <div className={styles.stats}>
      <Switch isSelected={includeEffects} onChange={onIncludeEffectsChange}>
        Include armor and weight effects
      </Switch>
      {includeEffects && (
        <p className={styles.note}>
          {effectSources.length === 0 ? "No armor or weight effects apply." : `Includes ${effectSources.join(", ")}.`}
        </p>
      )}
      <DataTable
        aria-label="Weapon stats"
        columns={COLUMNS}
        rows={rows}
        getRowKey={(row) => row.key}
        emptyText="No stats"
      />
    </div>
  );
}
