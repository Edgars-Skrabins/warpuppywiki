import { stkByDistance, type DistancePoint, type Scenario } from "@/core/damage";
import { MAX_DISTANCE } from "../state";

export const SERIES_STEP = 10;

export const SERIES_DISTANCES: readonly number[] = Array.from(
  { length: MAX_DISTANCE / SERIES_STEP + 1 },
  (_, index) => index * SERIES_STEP,
);

export function distanceSeries(scenario: Scenario): DistancePoint[] {
  return stkByDistance(scenario, SERIES_DISTANCES);
}
