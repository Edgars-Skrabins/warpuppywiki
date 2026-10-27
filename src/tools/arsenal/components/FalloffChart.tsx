import type { Weapon } from "@/core/data";
import { falloffSeries } from "@/core/weapons";
import { DataTable, formatDistance, formatMultiplier, LineChartCard, type Column } from "@/ui";
import styles from "./WeaponDetail.module.css";

export interface FalloffChartProps {
  name: string;
  stats: Weapon;
}

type FalloffPoint = NonNullable<Weapon["damageFalloff"]>[number];

const MAX_DISTANCE = 1200;
const STEP = 10;

const COLUMNS: Column<FalloffPoint>[] = [
  {
    key: "distance",
    header: "Distance",
    value: (point) => point.distance,
    render: (point) => formatDistance(point.distance),
  },
  {
    key: "multiplier",
    header: "Damage",
    value: (point) => point.multiplier,
    render: (point) => formatMultiplier(point.multiplier),
  },
  {
    key: "interpolation",
    header: "Curve to next",
    value: (point) => point.interpolation ?? null,
    render: (point) => point.interpolation ?? "Linear",
  },
];

export function FalloffChart({ name, stats }: FalloffChartProps) {
  const points = stats.damageFalloff ?? [];
  const series = [
    {
      key: "falloff",
      label: name,
      points: falloffSeries(stats, MAX_DISTANCE, STEP).map((point) => ({ x: point.distance, y: point.multiplier })),
    },
  ];
  return (
    <div className={styles.falloff}>
      <LineChartCard
        title="Damage by distance"
        subtitle={points.length === 0 ? "No falloff in the game files: full damage at every distance." : undefined}
        series={series}
        xLabel="Distance (m)"
        yLabel="Damage multiplier"
        formatX={formatDistance}
        formatY={formatMultiplier}
        xDomain={[0, MAX_DISTANCE]}
        yDomain={[0, "auto"]}
        referenceLines={
          stats.effectiveRange ? [{ axis: "x", value: stats.effectiveRange, label: "Effective range" }] : undefined
        }
      />
      {points.length > 0 && (
        <DataTable
          aria-label="Falloff points"
          columns={COLUMNS}
          rows={points}
          getRowKey={(point) => String(point.distance)}
          emptyText="No falloff points"
          maxHeight="none"
        />
      )}
    </div>
  );
}
