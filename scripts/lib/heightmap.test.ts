import { describe, expect, it } from "vitest";
import { downsampleU16, heightmapMeta, parseTerrain } from "./heightmap";

describe("downsampleU16", () => {
  it("averages each block", () => {
    const data = Uint16Array.from([0, 2, 10, 20, 4, 6, 30, 40, 100, 100, 65535, 65535, 100, 101, 65535, 65534]);
    const result = downsampleU16(data, 4, 4, 2);
    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
    expect(Array.from(result.data)).toEqual([3, 25, 100, 65535]);
  });

  it("averages a whole 4 x 4 block into one value", () => {
    const data = Uint16Array.from({ length: 16 }, (_, i) => i * 1000);
    expect(Array.from(downsampleU16(data, 4, 4, 4).data)).toEqual([7500]);
  });

  it("rejects sizes not divisible by the factor", () => {
    expect(() => downsampleU16(new Uint16Array(9), 3, 3, 2)).toThrow();
  });
});

describe("heightmapMeta", () => {
  it("derives meters per pixel from the bounds", () => {
    const terrain = parseTerrain(
      JSON.stringify({
        id: "europe",
        bounds: { min: [-16328.22, -16325.8], max: [5.93, 4.37] },
        zRange: { min: -1044.8, max: 0.04 },
      }),
    );
    const meta = heightmapMeta(terrain, 2048, 2048);
    expect(meta.width).toBe(2048);
    expect(meta.zRange).toEqual({ min: -1044.8, max: 0.04 });
    expect(meta.metersPerPixel).toBeCloseTo(7.9757, 3);
  });

  it("rejects terrain without bounds", () => {
    expect(() => parseTerrain(JSON.stringify({ zRange: { min: 0, max: 1 } }))).toThrow();
  });
});
