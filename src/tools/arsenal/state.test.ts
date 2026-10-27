import { describe, expect, it } from "vitest";
import { decodeState, encodeState } from "@/core/state";
import { DEFAULT_FILTERS, filtersCodec, hasActiveFilters, toggleValue } from "./state";

describe("filtersCodec", () => {
  it("round-trips filters through the URL", () => {
    const filters = { archetypes: ["SMG", "AR"], slots: ["Sidearm"], query: "9mm" };
    expect(decodeState(filtersCodec, encodeState(filtersCodec, filters))).toEqual({ state: filters, error: false });
  });

  it("falls back to no filters for a missing or broken parameter", () => {
    expect(decodeState(filtersCodec, null)).toEqual({ state: DEFAULT_FILTERS, error: false });
    expect(decodeState(filtersCodec, "1.broken")).toEqual({ state: DEFAULT_FILTERS, error: true });
  });
});

describe("toggleValue", () => {
  it("adds a missing value and removes a present one case-insensitively", () => {
    expect(toggleValue(["AR"], "SMG")).toEqual(["AR", "SMG"]);
    expect(toggleValue(["AR", "SMG"], "smg")).toEqual(["AR"]);
  });
});

describe("hasActiveFilters", () => {
  it("ignores a blank search", () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, query: "  " })).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, slots: ["Primary"] })).toBe(true);
  });
});
