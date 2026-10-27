import { describe, expect, it } from "vitest";
import type { MovementFile } from "@/core/data";
import movementJson from "../fixtures/movement.json";
import { defaultLos, losClick, losDataGap, losHint, stanceEyeHeights, targetHeightMeters } from "./losState";

const movement = movementJson as MovementFile;

describe("stanceEyeHeights", () => {
  it("reads each stance's eye height from movement.json", () => {
    expect(stanceEyeHeights(movement)).toEqual({ stand: 1.68, crouch: 1.18, prone: 0.36 });
  });

  it("has no height for a stance missing from the data", () => {
    const partial = { ...movement, stances: movement.stances.filter((stance) => stance.name !== "Prone") };
    expect(stanceEyeHeights(partial).prone).toBeNull();
    expect(stanceEyeHeights(null)).toEqual({ stand: null, crouch: null, prone: null });
  });
});

describe("targetHeightMeters", () => {
  const eyes = stanceEyeHeights(movement);

  it("uses 0 m for the ground, stance eye heights for people and the custom value", () => {
    expect(targetHeightMeters({ ...defaultLos(), targetHeight: "ground" }, eyes)).toBe(0);
    expect(targetHeightMeters({ ...defaultLos(), targetHeight: "crouch" }, eyes)).toBe(1.18);
    expect(targetHeightMeters({ ...defaultLos(), targetHeight: "custom", customHeight: 12 }, eyes)).toBe(12);
  });
});

describe("losClick", () => {
  it("sets the observer, then the target, then starts again", () => {
    const first = losClick(defaultLos(), [10.04, 20]);
    expect(first).toMatchObject({ observer: [10, 20], target: null });
    expect(losHint(first)).toBe("Click to set the target.");
    const second = losClick(first, [30, 40]);
    expect(second).toMatchObject({ observer: [10, 20], target: [30, 40] });
    expect(losClick(second, [50, 60])).toMatchObject({ observer: [50, 60], target: null });
  });

  it("sets the viewshed observer in viewshed mode", () => {
    const next = losClick({ ...defaultLos(), tool: "viewshed" }, [5, 6]);
    expect(next.viewshed.observer).toEqual([5, 6]);
    expect(next.observer).toBeNull();
  });
});

describe("losDataGap", () => {
  const eyes = stanceEyeHeights(movement);
  const noProne = { ...eyes, prone: null };
  const noStand = { ...eyes, stand: null };

  it("has no gap when the data has every height in use", () => {
    expect(losDataGap(defaultLos(), eyes)).toBeNull();
  });

  it("says when a height the result needs is not in the game data", () => {
    expect(losDataGap({ ...defaultLos(), stance: "prone" }, noProne)).toBe("Prone eye height: Not in game data.");
    expect(losDataGap({ ...defaultLos(), stance: "crouch" }, noStand)).toBe(
      "Standing person height: Not in game data.",
    );
    expect(losDataGap({ ...defaultLos(), stance: "crouch", tool: "viewshed" }, noStand)).toBe(
      "Standing eye height for the viewshed target: Not in game data.",
    );
    expect(losDataGap({ ...defaultLos(), stance: "crouch", targetHeight: "ground" }, noStand)).toBeNull();
  });
});
