import { describe, expect, it } from "vitest";
import { clampToBounds, isInBounds, pixelToWorld, worldToPixel } from "./coords";
import mapJson from "./fixtures/kavkazi/map.json";
import type { MapMeta } from "./types";

const map: MapMeta = {
  bounds: {
    min: [mapJson.bounds.min[0]!, mapJson.bounds.min[1]!],
    max: [mapJson.bounds.max[0]!, mapJson.bounds.max[1]!],
  },
  image: { metersPerPixel: mapJson.image.metersPerPixel },
};

describe("worldToPixel", () => {
  it("maps the world minimum to pixel (0, 0)", () => {
    expect(worldToPixel(map, -16320, -20400)).toEqual([0, 0]);
  });

  it("increases rows with world Y", () => {
    expect(worldToPixel(map, -16320, -20390)).toEqual([0, 10]);
  });

  it("uses metersPerPixel", () => {
    const coarse: MapMeta = { ...map, image: { metersPerPixel: 4 } };
    expect(worldToPixel(coarse, -16300, -20000)).toEqual([5, 100]);
  });

  it("round-trips a point through pixelToWorld", () => {
    const [px, py] = worldToPixel(map, -8123.456, -12345.678);
    const [x, y] = pixelToWorld(map, px, py);
    expect(x).toBeCloseTo(-8123.456, 9);
    expect(y).toBeCloseTo(-12345.678, 9);
  });
});

describe("bounds", () => {
  it("detects points inside and outside the map", () => {
    expect(isInBounds(map, -16320, -20400)).toBe(true);
    expect(isInBounds(map, 0, -4080)).toBe(true);
    expect(isInBounds(map, -8000, -12000)).toBe(true);
    expect(isInBounds(map, 1, -12000)).toBe(false);
    expect(isInBounds(map, -8000, -20401)).toBe(false);
  });

  it("clamps points to the bounds", () => {
    expect(clampToBounds(map, 50, -30000)).toEqual([0, -20400]);
    expect(clampToBounds(map, -8000, -12000)).toEqual([-8000, -12000]);
  });
});
