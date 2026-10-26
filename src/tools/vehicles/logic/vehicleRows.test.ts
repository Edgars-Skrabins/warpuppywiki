import { describe, expect, it } from "vitest";
import { fixtureVehicle, testCatalog, vehiclesFile } from "../fixtures/testData";
import { filterByTypes, vehicleRow, vehicleRows, vehicleType } from "./vehicleRows";

describe("vehicleType", () => {
  it("reads the type from the variant id, case-insensitively", () => {
    expect(vehicleType("Vehicle.Variant.Air.Rotary.Havoc.Default")).toBe("air");
    expect(vehicleType("Vehicle.Variant.Land.Tracked.TNK_04.Default")).toBe("tracked");
    expect(vehicleType("vehicle.variant.land.wheeled.Humvee.Default")).toBe("wheeled");
    expect(vehicleType("Vehicle.Stationary.Mortar")).toBeNull();
  });
});

describe("vehicleRow", () => {
  it("derives the Humvee's range from fuel and km per liter", () => {
    expect(vehicleRow(fixtureVehicle("Humvee"), testCatalog).range).toBeCloseTo(19.5);
  });

  it("joins price and unlock from items by the same id", () => {
    const row = vehicleRow(fixtureVehicle("Havoc"), testCatalog);
    expect(row.price).toBe(28000);
    expect(row.unlock).toMatchObject({ role: "Pilot", level: 35, cost: 650000 });
    expect(row.icon).toBe("UI/Shared/Icons/Vehicles/3D/T_UI_Vendor_Havoc.png");
  });

  it("shows no mass for tracked vehicles", () => {
    expect(vehicleRow(fixtureVehicle("T-72B3"), testCatalog).mass).toBeNull();
    expect(vehicleRow(fixtureVehicle("Humvee"), testCatalog).mass).toBe(7250);
  });

  it("has no price or unlock when the vehicle has no item", () => {
    const row = vehicleRow({ ...fixtureVehicle("Humvee"), id: "Vehicle.Variant.Land.Wheeled.Unknown" }, testCatalog);
    expect(row.price).toBeNull();
    expect(row.unlock).toBeNull();
  });
});

describe("filterByTypes", () => {
  it("keeps only the chosen types, or every row when none is chosen", () => {
    const rows = vehicleRows(vehiclesFile.vehicles, testCatalog);
    expect(filterByTypes(rows, ["air"]).map((row) => row.name)).toEqual(["Havoc", "AH-6M [Miniguns]"]);
    expect(filterByTypes(rows, ["tracked", "wheeled"]).map((row) => row.name)).toEqual(["T-72B3", "Humvee"]);
    expect(filterByTypes(rows, [])).toHaveLength(4);
  });
});
