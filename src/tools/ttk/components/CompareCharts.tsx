import type { DistancePoint } from "@/core/damage";
import { Grid, LineChartCard, formatDistance, formatNumber, formatSeconds, seriesColor, type LineSeries } from "@/ui";
import { stepPoints } from "../logic/stepPoints";

export interface CompareSeries {
  index: number;
  label: string;
  points: readonly DistancePoint[];
}

export interface CompareChartsProps {
  series: readonly CompareSeries[];
  distance: number;
}

function lines(series: readonly CompareSeries[], pick: (point: DistancePoint) => number | null, steps: boolean) {
  return series.map<LineSeries>((entry) => {
    const points = entry.points.map((point) => ({ x: point.distance, y: pick(point) }));
    return {
      key: `setup-${entry.index}`,
      label: `${entry.index + 1}. ${entry.label}`,
      color: seriesColor(entry.index),
      points: steps ? stepPoints(points) : points,
    };
  });
}

export function CompareCharts({ series, distance }: CompareChartsProps) {
  const markers = [{ axis: "x" as const, value: distance, label: "Selected" }];
  return (
    <Grid minColumnWidth={320}>
      <LineChartCard
        title="TTK by distance"
        series={lines(series, (point) => point.ttk, false)}
        xLabel="Distance"
        yLabel="Seconds"
        formatX={formatDistance}
        formatY={(value) => formatSeconds(value)}
        yDomain={[0, "auto"]}
        referenceLines={markers}
      />
      <LineChartCard
        title="STK by distance"
        series={lines(series, (point) => point.stk, true)}
        xLabel="Distance"
        yLabel="Shots"
        formatX={formatDistance}
        formatY={(value) => formatNumber(value, { maxFractionDigits: 0 })}
        yDomain={[0, "auto"]}
        referenceLines={markers}
      />
    </Grid>
  );
}
