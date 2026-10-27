import { LineChartCard, formatDistance, formatNumber, type LineSeries, type ReferenceLineSpec } from "@/ui";
import { heightAboveBore } from "../logic/rangeCard";
import { everyStep, type ChartSetup } from "./chartData";

export function TrajectoryChart({ setups }: { setups: readonly ChartSetup[] }) {
  const series: LineSeries[] = setups.map((setup) => ({
    key: setup.key,
    label: setup.label,
    points: everyStep(setup.samples).map((sample) => ({ x: sample.distance, y: heightAboveBore(sample) * 100 })),
  }));
  const referenceLines: ReferenceLineSpec[] = [{ axis: "y", value: 0, label: "Bore line" }];
  return (
    <LineChartCard
      title="Trajectory"
      subtitle="Height relative to the bore line (approximate)"
      series={series}
      xLabel="Distance"
      yLabel="Height (cm)"
      formatX={formatDistance}
      formatY={(value) => `${formatNumber(value, { maxFractionDigits: 0 })} cm`}
      referenceLines={referenceLines}
    />
  );
}
