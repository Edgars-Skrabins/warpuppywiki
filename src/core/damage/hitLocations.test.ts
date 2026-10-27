import { describe, expect, it } from "vitest";
import { HIT_LOCATIONS, HIT_PATTERNS, hitPattern } from "./hitLocations";

describe("hit locations", () => {
  it("lists the twelve locations of the multiplier table", () => {
    expect(HIT_LOCATIONS.map((info) => info.location)).toEqual([
      "Head",
      "Neck",
      "Torso.Upper",
      "Torso.Middle",
      "Torso.Lower",
      "Pelvis",
      "Arm.Upper",
      "Arm.Lower",
      "Arm.Hand",
      "Leg.Thigh",
      "Leg.Calf",
      "Leg.Foot",
    ]);
  });

  it("offers the presets with the mixed sequence", () => {
    expect(HIT_PATTERNS.map((pattern) => pattern.id)).toEqual([
      "head",
      "upper-chest",
      "center-mass",
      "stomach",
      "legs",
      "arms",
      "mixed",
    ]);
    expect(hitPattern("mixed").locations).toEqual(["Torso.Upper", "Torso.Upper", "Torso.Middle", "Head"]);
  });
});
