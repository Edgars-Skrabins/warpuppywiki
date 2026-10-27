import { describe, expect, it } from "vitest";
import type { TagsFile, VehiclesFile } from "@/core/data";
import { vehicleNamer } from "./vehicleNames";

const vehicles = {
  schemaVersion: 1,
  gameBuild: "25937608",
  vehicles: [
    { id: "Vehicle.Variant.Land.Wheeled.Bobcat.Default", name: "Bobcat" },
    { id: "Vehicle.Variant.Air.Rotary.Havoc.Default", name: "Havoc" },
  ],
} as unknown as VehiclesFile;

const tags = {
  schemaVersion: 1,
  gameBuild: "25937608",
  tags: [{ tag: "Vehicle.Archetype.Air.Rotary", text: "Rotary", source: "Archetypes" }],
} as unknown as TagsFile;

describe("vehicleNamer", () => {
  const name = vehicleNamer(vehicles, tags);

  it("names a vehicle by its id or its default variant, ignoring case", () => {
    expect(name("Vehicle.Variant.Air.Rotary.Havoc.Default")).toBe("Havoc");
    expect(name("vehicle.variant.land.wheeled.bobcat")).toBe("Bobcat");
  });

  it("falls back to the tag text, then to the raw id", () => {
    expect(name("Vehicle.Archetype.Air.Rotary")).toBe("Rotary");
    expect(name("Vehicle.Variant.Land.Tracked.SpawnVehicle.Manticore")).toBe(
      "Vehicle.Variant.Land.Tracked.SpawnVehicle.Manticore",
    );
    expect(vehicleNamer(null, null)("Vehicle.Variant.Air.Airplane")).toBe("Vehicle.Variant.Air.Airplane");
  });
});
