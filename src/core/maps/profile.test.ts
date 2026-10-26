import { describe, expect, it } from "vitest";
import { syntheticHeightmap } from "./fixtures/syntheticHeightmap";
import { elevationProfile } from "./profile";

const heightmap = syntheticHeightmap();

describe("elevationProfile", () => {
  it("samples the ground every step along the path, including both ends", () => {
    const profile = elevationProfile(heightmap, [105, 215], [125, 215], 5);
    expect(profile.map((p) => p.distance)).toEqual([0, 5, 10, 15, 20]);
    expect(profile.map((p) => p.x)).toEqual([105, 110, 115, 120, 125]);
    expect(profile.every((p) => p.y === 215)).toBe(true);
    const heights = profile.map((p) => p.z!);
    [-97, -96.5, -96, -95.5, -95].forEach((z, i) => expect(heights[i]).toBeCloseTo(z, 9));
  });

  it("shortens the step so the samples end exactly at the target", () => {
    const profile = elevationProfile(heightmap, [105, 205], [105, 212], 3);
    expect(profile).toHaveLength(4);
    expect(profile.at(-1)).toMatchObject({ distance: 7, x: 105, y: 212 });
  });

  it("reports null heights outside the heightmap", () => {
    const profile = elevationProfile(heightmap, [125, 205], [145, 205], 10);
    expect(profile.map((p) => p.z === null)).toEqual([false, true, true]);
  });

  it("rejects a non-positive step", () => {
    expect(() => elevationProfile(heightmap, [105, 205], [125, 205], 0)).toThrow();
  });
});
