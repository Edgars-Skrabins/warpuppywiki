import { describe, expect, it } from "vitest";
import { simulateKill } from "@/core/damage";
import { fixtureSources } from "../fixtures/sources";
import { DEFAULT_MATCHUP } from "../state";
import { buildScenario } from "./buildScenario";
import { distanceSeries } from "./distanceSeries";

describe("distanceSeries", () => {
  const result = buildScenario({ ...DEFAULT_MATCHUP, bodyArmorId: "Id.Item.HeavyArmor" }, fixtureSources);
  if (!result.ok) throw new Error(result.error);
  const { scenario } = result;
  const series = distanceSeries(scenario);

  it("returns a point every 10 m from 0 to 1,000 m", () => {
    expect(series).toHaveLength(101);
    expect(series[0]?.distance).toBe(0);
    expect(series[100]?.distance).toBe(1000);
  });

  it.each([0, 300, 850])("matches simulateKill at %i m", (distance) => {
    const kill = simulateKill({ ...scenario, distance });
    if (!kill.supported) throw new Error(kill.reason);
    const point = series.find((entry) => entry.distance === distance);
    expect(point?.stk).toBe(kill.stk);
    expect(point?.ttk).toBe(kill.ttk);
  });
});
