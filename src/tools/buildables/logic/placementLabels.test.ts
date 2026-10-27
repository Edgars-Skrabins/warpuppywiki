import { describe, expect, it } from "vitest";
import { placementLabel, splitWords } from "./placementLabels";

describe("placementLabel", () => {
  it("uses the readable label for known rules, case-insensitively", () => {
    expect(placementLabel("WithinFobBounds")).toBe("Inside FOB area");
    expect(placementLabel("safezone")).toBe("Not in safe zones");
  });

  it("splits unknown rules into words", () => {
    expect(placementLabel("WithinLadderBounds")).toBe("Within ladder bounds");
    expect(placementLabel("LimitedByFOBCondition")).toBe("Limited by FOB condition");
  });
});

describe("splitWords", () => {
  it("turns tool names into sentence-case words", () => {
    expect(splitWords("LargeHammer")).toBe("Large hammer");
    expect(splitWords("CrowsNest.BaseFloor")).toBe("Crows nest base floor");
  });
});
