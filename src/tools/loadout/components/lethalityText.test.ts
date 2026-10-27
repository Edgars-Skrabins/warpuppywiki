import { describe, expect, it } from "vitest";
import { extraShotsText, pointText } from "./lethalityText";

describe("pointText", () => {
  it("shows shots and time, a reload or a dash", () => {
    expect(pointText({ distance: 25, stk: 5, ttk: 0.37, needsReload: false })).toBe("5 · 0.37 s");
    expect(pointText({ distance: 25, stk: 6, ttk: null, needsReload: true })).toBe("6 · reload");
    expect(pointText({ distance: 25, stk: null, ttk: null, needsReload: false })).toBe("—");
  });
});

describe("extraShotsText", () => {
  it("describes the difference armor makes", () => {
    expect(extraShotsText(2)).toBe("+2 shots");
    expect(extraShotsText(1)).toBe("+1 shot");
    expect(extraShotsText(0)).toBe("No change");
    expect(extraShotsText(null)).toBe("—");
  });
});
