import { describe, expect, it } from "vitest";
import { buildablesFile, fixtureBuildable } from "../fixtures/testData";
import { buildableName, buildableRow, buildableRows } from "./buildableRows";

describe("buildableRow", () => {
  it("derives health per supply, footprint and readable labels", () => {
    const row = buildableRow(fixtureBuildable("Indirect Fire Shelter"));

    expect(row.cost).toBe(200);
    expect(row.health).toBe(5000);
    expect(row.healthPerSupply).toBe(25);
    expect(row.footprint).toEqual({ width: 7.5, depth: 7.5, height: 4.6 });
    expect(row.volume).toBeCloseTo(7.5 * 7.5 * 4.6);
    expect(row.repairSpeed).toBe(6.67);
    expect(row.maxStack).toBe(1);
    expect(row.tools).toEqual(["Large hammer"]);
    expect(row.placement).toEqual(["Inside FOB area", "Within ladder bounds", "Not in safe zones"]);
    expect(row.damageEntity).toBe("Buildable.AirRaidShelter");
  });

  it("leaves missing values empty", () => {
    const row = buildableRow({ ...fixtureBuildable("Sandbag Wall"), cost: 0, size: null });

    expect(row.repairSpeed).toBeNull();
    expect(row.healthPerSupply).toBeNull();
    expect(row.footprint).toBeNull();
    expect(row.volume).toBeNull();
  });

  it("builds one row per buildable", () => {
    expect(buildableRows(buildablesFile.buildables).map((row) => row.name)).toEqual([
      "Indirect Fire Shelter",
      "Sandbag Wall",
    ]);
  });
});

describe("buildableName", () => {
  it("falls back to the id without its prefix", () => {
    expect(buildableName({ ...fixtureBuildable("Sandbag Wall"), id: "Id.Buildable.CrowsNest.Roof", name: null })).toBe(
      "Crows nest roof",
    );
  });
});
