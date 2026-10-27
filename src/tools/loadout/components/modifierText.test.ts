import { describe, expect, it } from "vitest";
import { weaponIndex } from "../fixtures/testData";
import { modifierSummary } from "./modifierText";

describe("modifierSummary", () => {
  it("writes an attachment's modifiers in short form", () => {
    const scope = weaponIndex.attachment("Id.Item.3xScope");
    expect(scope && modifierSummary(scope)).toBe(
      "Zoom 3×, Min zeroing 100 m, Max zeroing 300 m, ADS ×1.1, Sway settle time ×1.35",
    );
  });
});
