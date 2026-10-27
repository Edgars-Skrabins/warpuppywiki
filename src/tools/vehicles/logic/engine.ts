import type { Vehicle } from "@/core/data";

type Engine = NonNullable<Vehicle["engine"]>;
type Transmission = NonNullable<Vehicle["transmission"]>;

export interface TorquePoint {
  rpm: number;
  torque: number;
}

export function torqueCurve(engine: Engine | null | undefined): TorquePoint[] {
  if (!engine) return [];
  const scale = engine.torqueScale ?? 1;
  return engine.torqueCurve.map((point) => ({ rpm: point.rpm, torque: point.torque * scale }));
}

export function peakTorque(engine: Engine | null | undefined): TorquePoint | null {
  return torqueCurve(engine).reduce<TorquePoint | null>(
    (best, point) => (best === null || point.torque > best.torque ? point : best),
    null,
  );
}

export function gearCount(transmission: Transmission | null | undefined): number | null {
  if (!transmission || transmission.gearRatios.length === 0) return null;
  return transmission.gearRatios.slice(0, -1).filter((ratio) => ratio !== 0).length;
}
