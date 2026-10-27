import { describe, expect, it } from "vitest";
import type { ObjectiveConfig, ObjectivesFile } from "@/core/data";
import objectivesJson from "@/test/fixtures/data/25937608/maps/kavkazi/objectives.json";
import {
  chanceLabel,
  findConfig,
  placementName,
  SNIPER_SHOWDOWN_MODE,
  STANDARD_MODE,
  zonePlacements,
} from "./zoneChances";

const objectives = objectivesJson as ObjectivesFile;
const standard = findConfig(objectives, STANDARD_MODE)!;

function withWeights(config: ObjectiveConfig, weights: number[]): ObjectiveConfig {
  return {
    ...config,
    alternatives: config.alternatives.map((alternative, index) => ({ ...alternative, weight: weights[index] ?? 0 })),
  };
}

describe("findConfig", () => {
  it("finds the Standard and Sniper Showdown configs by mode, ignoring case", () => {
    expect(standard.config).toBe("DA_ControlZoneConfig_Bakurani");
    expect(findConfig(objectives, SNIPER_SHOWDOWN_MODE)?.config).toBe("DA_ControlZoneConfig_SniperShowdown_Bakurani");
    expect(findConfig(objectives, "standard")).toBe(standard);
  });

  it("returns null for a missing mode or file", () => {
    expect(findConfig(objectives, "Domination")).toBeNull();
    expect(findConfig(null, STANDARD_MODE)).toBeNull();
  });
});

describe("zonePlacements", () => {
  it("gives each Kavkazi placement its share of the weights, summing to 100%", () => {
    const placements = zonePlacements(standard);
    expect(placements.map((placement) => [placementName(placement.id), chanceLabel(placement)])).toEqual([
      ["Default", "50%"],
      ["Farmland", "25%"],
      ["Lumberyard", "25%"],
    ]);
    expect(placements.reduce((sum, placement) => sum + (placement.chance ?? 0), 0)).toBeCloseTo(1);
  });

  it("marks a weight-0 placement as never chosen and leaves it out of the others' chances", () => {
    const placements = zonePlacements(withWeights(standard, [1, 0, 1]));
    expect(placements.map((placement) => [placement.never, chanceLabel(placement)])).toEqual([
      [false, "50%"],
      [true, "Never chosen"],
      [false, "50%"],
    ]);
  });

  it("uses the config's own zone at 100% when there are no alternatives", () => {
    const sniper = findConfig(objectives, SNIPER_SHOWDOWN_MODE)!;
    expect(zonePlacements(sniper)).toEqual([
      { id: "Default", zone: sniper.zone, weight: null, chance: 1, never: false, isDefault: true },
    ]);
  });

  it("gives no chance when no weight is usable", () => {
    const placements = zonePlacements(withWeights(standard, [0, -2, Number.NaN]));
    expect(placements.map(chanceLabel)).toEqual(["Chance unknown", "Chance unknown", "Chance unknown"]);
  });
});

describe("placementName", () => {
  it("takes the place name from an alternator id", () => {
    expect(placementName("ZoneAlternator.Zestafona.WaterTreatment.Circle")).toBe("WaterTreatment");
    expect(placementName("Default")).toBe("Default");
  });
});
