import { formatNumber, LineChartCard, type LineSeries } from "@/ui";
import { torqueCurve } from "../logic/engine";
import type { VehicleRow } from "../logic/vehicleRows";

export interface TorqueChartProps {
  vehicles: readonly VehicleRow[];
}

export function TorqueChart({ vehicles }: TorqueChartProps) {
  const series: LineSeries[] = vehicles
    .map((row) => ({
      key: row.id,
      label: row.name,
      points: torqueCurve(row.vehicle.engine).map(({ rpm, torque }) => ({ x: rpm, y: torque })),
    }))
    .filter((line) => line.points.length > 0);
  if (series.length === 0) return null;
  return (
    <LineChartCard
      title="Torque curve"
      series={series}
      xLabel="RPM"
      yLabel="Torque"
      formatX={(value) => formatNumber(value, { maxFractionDigits: 0 })}
      formatY={(value) => formatNumber(value, { maxFractionDigits: 0 })}
      yDomain={[0, "auto"]}
    />
  );
}
