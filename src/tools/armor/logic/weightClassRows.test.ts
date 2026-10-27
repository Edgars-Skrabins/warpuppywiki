import { describe, expect, it } from "vitest";
import { fixtureEquipment } from "../fixtures/testData";
import { classFor, WEIGHT_COLUMNS, weightClassRows } from "./weightClassRows";

const rows = weightClassRows(fixtureEquipment.weightClasses);

describe("weightClassRows", () => {
  it("has the eight modifier columns with their direction", () => {
    expect(WEIGHT_COLUMNS.map((column) => column.label)).toEqual([
      "Top speed",
      "Jump",
      "Stamina regen",
      "Aim sway",
      "Aim sway speed",
      "ADS time",
      "Lean time",
      "Weight penalty",
    ]);
    expect(WEIGHT_COLUMNS.find((column) => column.label === "Top speed")?.betterWhen).toBe("higher");
    expect(WEIGHT_COLUMNS.find((column) => column.label === "ADS time")?.betterWhen).toBe("lower");
  });

  it("orders the five classes with their thresholds", () => {
    expect(rows.map((row) => [row.label, row.minKg, row.maxKg])).toEqual([
      ["Lightest", 0, 10],
      ["Light", 10, 17],
      ["Medium", 17, 27],
      ["Heavy", 27, 40],
      ["Super heavy", 40, null],
    ]);
  });

  it("combines each class's modifiers per column, with neutral values when absent", () => {
    const [lightest, , medium, heavy] = rows;
    expect(lightest?.values["Movement.MaxSpeedMultiplier"]).toBe(1);
    expect(lightest?.values["Character.Weight"]).toBe(0);
    expect(medium?.values["Movement.MaxSpeedMultiplier"]).toBe(0.875);
    expect(medium?.values["Movement.LeanTimeMultiplier"]).toBe(1);
    expect(medium?.values["Character.AimSwayScaleMultiplier"]).toBeCloseTo(1.085);
    expect(medium?.values["Character.Weight"]).toBe(2);
    expect(heavy?.values["Movement.LeanTimeMultiplier"]).toBe(1.5);
  });
});

describe("classFor", () => {
  it("finds the class for a kit weight and the kg left until the next", () => {
    expect(classFor(rows, 18)?.row.name).toBe("Medium");
    expect(classFor(rows, 18)?.kgToNext).toBe(9);
    expect(classFor(rows, 17)?.row.name).toBe("Medium");
    expect(classFor(rows, 9.5)?.row.name).toBe("Lightest");
    expect(classFor(rows, 9.5)?.kgToNext).toBe(0.5);
  });

  it("has no next class at the top", () => {
    expect(classFor(rows, 55)?.row.name).toBe("SuperHeavy");
    expect(classFor(rows, 55)?.kgToNext).toBeNull();
  });

  it("finds nothing below the lightest threshold", () => {
    expect(classFor(rows, -1)).toBeNull();
  });
});
