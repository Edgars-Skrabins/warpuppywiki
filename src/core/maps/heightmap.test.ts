import { describe, expect, it } from "vitest";
import { syntheticHeightmap, syntheticMeta, u16Buffer } from "./fixtures/syntheticHeightmap";
import { parseHeightmap } from "./heightmap";

const heightmap = syntheticHeightmap();
const metersPerValue = 0.01;

describe("parseHeightmap", () => {
  it("returns exact values at pixel centers", () => {
    expect(heightmap.heightAt(105, 205)).toBeCloseTo(-100, 9);
    expect(heightmap.heightAt(115, 205)).toBeCloseTo(-100 + 100 * metersPerValue, 9);
    expect(heightmap.heightAt(105, 215)).toBeCloseTo(-100 + 300 * metersPerValue, 9);
    expect(heightmap.heightAt(125, 225)).toBeCloseTo(-100 + 800 * metersPerValue, 9);
  });

  it("samples bilinearly between pixel centers", () => {
    expect(heightmap.heightAt(110, 210)).toBeCloseTo(-100 + 200 * metersPerValue, 9);
    expect(heightmap.heightAt(120, 215)).toBeCloseTo(-100 + 450 * metersPerValue, 9);
  });

  it("holds the edge value in the outer half pixel", () => {
    expect(heightmap.heightAt(100, 200)).toBeCloseTo(-100, 9);
    expect(heightmap.heightAt(130, 230)).toBeCloseTo(-100 + 800 * metersPerValue, 9);
  });

  it("returns null outside its bounds", () => {
    expect(heightmap.heightAt(99.9, 210)).toBeNull();
    expect(heightmap.heightAt(110, 230.1)).toBeNull();
  });

  it("reads values as little-endian", () => {
    const buffer = new ArrayBuffer(18);
    new Uint8Array(buffer).set([0x34, 0x12]);
    const parsed = parseHeightmap({ ...syntheticMeta, zRange: { min: 0, max: 65535 } }, buffer);
    expect(parsed.heightAt(105, 205)).toBeCloseTo(0x1234, 9);
  });

  it("throws when the buffer length does not match width × height", () => {
    expect(() => parseHeightmap(syntheticMeta, u16Buffer([1, 2, 3, 4, 5, 6, 7, 8]))).toThrow(/expected 3 × 3 = 9/);
  });
});
