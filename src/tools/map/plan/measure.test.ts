import { describe, expect, it } from "vitest";
import { formatBearing, measurePath } from "./measure";

describe("measurePath", () => {
  it("gives each segment its length, bearing from map-up and midpoint", () => {
    const { segments } = measurePath([
      [0, 0],
      [0, -300],
      [400, -300],
    ]);
    expect(segments.map(({ length, bearing, midpoint }) => ({ length, bearing, midpoint }))).toEqual([
      { length: 300, bearing: 0, midpoint: [0, -150] },
      { length: 400, bearing: 90, midpoint: [200, -300] },
    ]);
  });

  it("sums the path and measures first to last in a straight line", () => {
    const measurement = measurePath([
      [0, 0],
      [0, -300],
      [400, -300],
    ]);
    expect(measurement.total).toBe(700);
    expect(measurement.straight).toBe(500);
  });

  it("uses ground heights in 3D and falls back to 2D where a height is missing", () => {
    const heightAt = (x: number) => (x < 0 ? null : x / 10);
    const measurement = measurePath(
      [
        [0, 0],
        [300, -400],
        [-300, -400],
      ],
      heightAt,
    );
    expect(measurement.segments[0]!.length).toBeCloseTo(Math.hypot(300, 400, 30));
    expect(measurement.segments[1]!.length).toBe(600);
    expect(measurement.threeD).toBe(true);
  });

  it("has nothing to measure with fewer than two points", () => {
    expect(measurePath([])).toEqual({ segments: [], total: 0, straight: 0, threeD: false });
    expect(measurePath([[5, 5]]).total).toBe(0);
  });
});

describe("formatBearing", () => {
  it("shows whole degrees with three digits", () => {
    expect(formatBearing(5.4)).toBe("005°");
    expect(formatBearing(359.7)).toBe("000°");
    expect(formatBearing(90)).toBe("090°");
  });
});
