import type { TrajectorySample } from "../logic/trajectory";

export const CHART_STEP = 5;

export interface ChartSetup {
  key: string;
  label: string;
  samples: readonly TrajectorySample[];
}

export function everyStep(samples: readonly TrajectorySample[]): TrajectorySample[] {
  return samples.filter((_, i) => i % CHART_STEP === 0 || i === samples.length - 1);
}
