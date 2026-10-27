import { describe, expect, it } from "vitest";
import { hitPattern } from "./hitLocations";

describe("hit locations", () => {
  it("offers the presets with the mixed sequence", () => {
    expect(hitPattern("mixed").locations).toEqual(["Torso.Upper", "Torso.Upper", "Torso.Middle", "Head"]);
  });
});
