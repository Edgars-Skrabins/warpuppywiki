import { LineChartCard, formatDistance, formatSeconds, type LineSeries } from "@/ui";
import { everyStep, type ChartSetup } from "./chartData";

export function FlightTimeChart({ setups }: { setups: readonly ChartSetup[] }) {
  const series: LineSeries[] = setups.map((setup) => ({
    key: setup.key,
    label: setup.label,
    points: everyStep(setup.samples).map((sample) => ({ x: sample.distance, y: sample.time })),
  }));
  return (
    <LineChartCard
      title="Time of flight"
      subtitle="Seconds from the muzzle (approximate)"
      series={series}
      xLabel="Distance"
      yLabel="Time (s)"
      formatX={formatDistance}
      formatY={(value) => formatSeconds(value)}
      yDomain={[0, "auto"]}
    />
  );
}
