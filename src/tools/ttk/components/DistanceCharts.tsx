import type { DistancePoint } from "@/core/damage";
import { Grid, LineChartCard, formatDistance, formatNumber, formatSeconds, type ReferenceLineSpec } from "@/ui";
import { stepPoints } from "../logic/stepPoints";

export interface DistanceChartsProps {
  series: readonly DistancePoint[];
  distance: number;
  effectiveRange: number | null;
}

export function DistanceCharts({ series, distance, effectiveRange }: DistanceChartsProps) {
  const markers: ReferenceLineSpec[] = [{ axis: "x", value: distance, label: "Selected" }];
  if (effectiveRange !== null && effectiveRange !== distance) {
    markers.push({ axis: "x", value: effectiveRange, label: "Effective range" });
  }
  const stk = stepPoints(series.map((point) => ({ x: point.distance, y: point.stk })));
  const ttk = series.map((point) => ({ x: point.distance, y: point.ttk }));
  return (
    <Grid minColumnWidth={320}>
      <LineChartCard
        title="STK by distance"
        series={[{ key: "stk", label: "Shots to kill", points: stk }]}
        xLabel="Distance"
        yLabel="Shots"
        formatX={formatDistance}
        formatY={(value) => formatNumber(value, { maxFractionDigits: 0 })}
        yDomain={[0, "auto"]}
        referenceLines={markers}
      />
      <LineChartCard
        title="TTK by distance"
        series={[{ key: "ttk", label: "Time to kill", points: ttk }]}
        xLabel="Distance"
        yLabel="Seconds"
        formatX={formatDistance}
        formatY={(value) => formatSeconds(value)}
        yDomain={[0, "auto"]}
        referenceLines={markers}
      />
    </Grid>
  );
}
