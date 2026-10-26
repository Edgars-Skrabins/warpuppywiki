import { describe, expect, it } from "vitest";
import { combine } from "@/core/modifiers";
import { cumulativeRecoil, scaledRecoilPattern } from "./recoil";

const weapon = {
  recoil: {
    pattern: [
      { x: 0.1, y: 1 },
      { x: -0.2, y: 2 },
    ],
  },
};

describe("scaledRecoilPattern", () => {
  it("multiplies x by the horizontal and y by the vertical multiplier", () => {
    const stats = {
      horizontalRecoil: { ...combine(1, []), value: 2 },
      verticalRecoil: { ...combine(1, []), value: 1.5 },
    };
    expect(scaledRecoilPattern(weapon, stats)).toEqual([
      { x: 0.2, y: 1.5 },
      { x: -0.4, y: 3 },
    ]);
  });

  it("returns an empty pattern for a weapon without recoil data", () => {
    expect(scaledRecoilPattern({}, { horizontalRecoil: combine(1, []), verticalRecoil: combine(1, []) })).toEqual([]);
  });
});

describe("cumulativeRecoil", () => {
  it("returns running sums starting at the origin", () => {
    const sums = cumulativeRecoil(weapon.recoil.pattern);
    expect(sums).toHaveLength(3);
    expect(sums[0]).toEqual({ x: 0, y: 0 });
    expect(sums[1]).toEqual({ x: 0.1, y: 1 });
    expect(sums[2]?.x).toBeCloseTo(-0.1);
    expect(sums[2]?.y).toBeCloseTo(3);
  });
});
