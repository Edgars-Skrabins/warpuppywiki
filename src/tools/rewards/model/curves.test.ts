import { describe, expect, it } from "vitest";
import type { RewardCurve } from "@/core/data";
import fixture from "../fixtures/challenge-rewards.json";
import { curveLookup, curvePoints, curveValue } from "./curves";

const curves = curveLookup(fixture.curves as RewardCurve[]);
const distance = curves("LiveCurves.Challenges.SessionEvents.PlayerKill.DistanceScalar")!;

describe("curveValue", () => {
  it("holds constant points until the next input on the distance scalar curve", () => {
    expect(curveValue(distance, 0)).toBe(1);
    expect(curveValue(distance, 29_900)).toBe(1);
    expect(curveValue(distance, 30_000)).toBe(1.5);
    expect(curveValue(distance, 100_000)).toBe(4);
  });

  it("uses the first value before the first point and the last after the last", () => {
    const curve: RewardCurve = {
      id: "Test",
      points: [
        { input: 10, value: 2, interpolation: "linear" },
        { input: 20, value: 4, interpolation: "linear" },
      ],
    };
    expect(curveValue(curve, -5)).toBe(2);
    expect(curveValue(curve, 50)).toBe(4);
  });

  it("interpolates linear and cubic segments", () => {
    const curve: RewardCurve = {
      id: "Test",
      points: [
        { input: 0, value: 0, interpolation: "linear" },
        { input: 10, value: 10, interpolation: "cubic" },
        { input: 20, value: 20, interpolation: "constant" },
      ],
    };
    expect(curveValue(curve, 2.5)).toBe(2.5);
    expect(curveValue(curve, 15)).toBe(15);
    expect(curveValue(curve, 12.5)).toBeCloseTo(10 + 10 * 0.15625);
  });

  it("looks curves up without regard to case", () => {
    expect(curves("livecurves.challenges.sessionevents.playerkill.distancescalar")).toBe(distance);
    expect(curves("Missing")).toBeUndefined();
  });
});

describe("curvePoints", () => {
  it("draws constant segments as steps and extends the last value", () => {
    const artillery = curves("LiveCurves.Challenges.SessionEvents.PlayerKill.DistanceScalar.Artillery")!;
    const points = curvePoints(artillery, 200_000);
    expect(points.map((point) => point.value)).toEqual([1, 1, 1.25, 1.25, 1.5, 1.5]);
    expect(points[1]!.input).toBeLessThan(50_000);
    expect(points[1]!.input).toBeCloseTo(50_000, 0);
    expect(points[points.length - 1]).toEqual({ input: 200_000, value: 1.5 });
  });
});
