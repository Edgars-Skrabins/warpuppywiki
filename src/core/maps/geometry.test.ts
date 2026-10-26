import { describe, expect, it } from "vitest";
import { bearingDegrees, distance2d, distance3d, lerpPoint } from "./geometry";

describe("distances", () => {
  it("measures on the ground in 2D", () => {
    expect(distance2d([0, 0], [3, 4])).toBe(5);
    expect(distance2d([0, 0, 100], [3, 4, -50])).toBe(5);
  });

  it("includes height in 3D", () => {
    expect(distance3d([1, 2, 3], [3, 5, 9])).toBe(7);
  });
});

describe("bearingDegrees", () => {
  it("is 0 for a target at lower world Y (map up)", () => {
    expect(bearingDegrees([10, 10], [10, 0])).toBe(0);
  });

  it("is 90 for a target at higher world X", () => {
    expect(bearingDegrees([10, 10], [20, 10])).toBe(90);
  });

  it("is 180 for a target at higher world Y", () => {
    expect(bearingDegrees([10, 10], [10, 20])).toBe(180);
  });

  it("is 270 for a target at lower world X", () => {
    expect(bearingDegrees([10, 10], [0, 10])).toBe(270);
  });

  it("is 45 between map up and right", () => {
    expect(bearingDegrees([0, 0], [5, -5])).toBeCloseTo(45, 9);
  });
});

describe("lerpPoint", () => {
  it("interpolates all three axes", () => {
    expect(lerpPoint([0, 0, 0], [10, 20, 30], 0.25)).toEqual([2.5, 5, 7.5]);
  });
});
