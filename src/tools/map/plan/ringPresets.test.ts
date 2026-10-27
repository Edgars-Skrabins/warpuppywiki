import { describe, expect, it } from "vitest";
import { parseCustomDistances, presetDistances, RING_PRESETS } from "./ringPresets";

describe("ring presets", () => {
  it("has the role presets with four distances each", () => {
    expect(RING_PRESETS.map((preset) => preset.label)).toEqual(["Infantry", "Marksman", "Mortar / artillery"]);
    expect(presetDistances("artillery")).toEqual([500, 1000, 2000, 3000]);
    expect(presetDistances("custom")).toBeNull();
  });
});

describe("parseCustomDistances", () => {
  it("reads comma-separated meters, sorted and without repeats", () => {
    expect(parseCustomDistances(" 400, 150 m,150 , 1200.4")).toEqual({ ok: true, distances: [150, 400, 1200] });
  });

  it("rejects empty input, text and values out of range", () => {
    expect(parseCustomDistances(" , ")).toMatchObject({ ok: false });
    expect(parseCustomDistances("100, far")).toEqual({
      ok: false,
      error: "Use numbers separated by commas, for example 150, 400.",
    });
    expect(parseCustomDistances("5")).toEqual({ ok: false, error: "Distances must be between 10 and 20,000 m." });
    expect(parseCustomDistances("20001")).toMatchObject({ ok: false });
  });

  it("allows at most eight distances", () => {
    expect(parseCustomDistances("10,20,30,40,50,60,70,80")).toMatchObject({ ok: true });
    expect(parseCustomDistances("10,20,30,40,50,60,70,80,90")).toEqual({ ok: false, error: "Up to 8 distances." });
  });
});
