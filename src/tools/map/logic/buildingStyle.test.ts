import { describe, expect, it } from "vitest";
import type { Building, BuildingsFile } from "@/core/data";
import buildingsJson from "@/test/fixtures/data/25937608/maps/kavkazi/buildings.json";
import { BUILDING_KINDS, BUILDING_STYLES, buildingCounts, buildingSize, isDrawable } from "./buildingStyle";

const buildings = (buildingsJson as BuildingsFile).buildings;

describe("buildingCounts", () => {
  it("counts the Kavkazi fixture's buildings by kind, with zero for absent kinds", () => {
    expect(buildingCounts(buildings)).toEqual({
      bungalow: 5,
      house: 3,
      apartment: 0,
      warehouse: 0,
      market: 0,
      shop: 0,
      garage: 2,
      office: 0,
      supply: 0,
      pool: 0,
    });
  });
});

describe("BUILDING_STYLES", () => {
  it("gives every kind a label and its own color token", () => {
    const colors = BUILDING_KINDS.map((kind) => BUILDING_STYLES[kind].color);
    expect(new Set(colors).size).toBe(BUILDING_KINDS.length);
    expect(colors.every((color) => color.startsWith("--"))).toBe(true);
  });
});

describe("buildingSize", () => {
  it("measures the footprint, height and ground height of a box", () => {
    const size = buildingSize(buildings[0]!)!;
    expect(size.width).toBeCloseTo(21.51);
    expect(size.depth).toBeCloseTo(25.69);
    expect(size.height).toBeCloseTo(9.31);
    expect(size.ground).toBeCloseTo(-726.83);
  });

  it("skips boxes with missing or flat footprints", () => {
    const flat: Building = {
      ...buildings[0]!,
      max: [buildings[0]!.min[0], buildings[0]!.max[1], buildings[0]!.max[2]],
    };
    const broken: Building = { ...buildings[0]!, min: [Number.NaN, 0, 0] };
    expect(isDrawable(buildings[0]!)).toBe(true);
    expect(isDrawable(flat)).toBe(false);
    expect(buildingSize(broken)).toBeNull();
  });
});
