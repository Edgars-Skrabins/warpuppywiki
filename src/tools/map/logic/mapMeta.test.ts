import { describe, expect, it } from "vitest";
import type { MapFile } from "@/core/data";
import mapJson from "@/test/fixtures/data/25937608/maps/kavkazi/map.json";
import { mapProblem, syncedNativeZoom } from "./mapMeta";

const kavkazi = mapJson as MapFile;

describe("mapProblem", () => {
  it("accepts a real map", () => {
    expect(mapProblem(kavkazi)).toBeNull();
  });

  it("rejects empty, inverted or non-finite bounds", () => {
    expect(mapProblem({ ...kavkazi, bounds: { min: [0, 0], max: [0, 100] } })).toMatch(/bounds/);
    expect(mapProblem({ ...kavkazi, bounds: { min: [10, 10], max: [-10, 20] } })).toMatch(/bounds/);
    expect(mapProblem({ ...kavkazi, bounds: { min: [Number.NaN, 0], max: [10, 10] } })).toMatch(/bounds/);
  });

  it("rejects a zero scale or image size", () => {
    expect(mapProblem({ ...kavkazi, image: { ...kavkazi.image, metersPerPixel: 0 } })).toMatch(/image/);
    expect(mapProblem({ ...kavkazi, image: { ...kavkazi.image, width: -1 } })).toMatch(/image/);
  });

  it("rejects impossible tile settings", () => {
    expect(mapProblem({ ...kavkazi, tiles: { ...kavkazi.tiles, minZoom: 4, maxZoom: 2 } })).toMatch(/tile/);
    expect(mapProblem({ ...kavkazi, tiles: { ...kavkazi.tiles, size: 0 } })).toMatch(/tile/);
  });
});

describe("syncedNativeZoom", () => {
  it("uses the highest synced level", () => {
    expect(syncedNativeZoom(kavkazi, 6)).toBe(6);
    expect(syncedNativeZoom(kavkazi, 4)).toBe(4);
  });

  it("never goes past the map's own highest level", () => {
    expect(syncedNativeZoom(kavkazi, 9)).toBe(6);
  });

  it("treats a missing or unusable level as no imagery", () => {
    expect(syncedNativeZoom(kavkazi, undefined)).toBeNull();
    expect(syncedNativeZoom(kavkazi, null)).toBeNull();
    expect(syncedNativeZoom(kavkazi, -1)).toBeNull();
    expect(syncedNativeZoom(kavkazi, Number.NaN)).toBeNull();
  });
});
