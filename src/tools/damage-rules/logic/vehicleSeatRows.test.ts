import { describe, expect, it } from "vitest";
import { damageFile, vehiclesFile } from "../fixtures/gameData";
import { vehicleSeatRows } from "./vehicleSeatRows";

describe("vehicleSeatRows", () => {
  const rows = vehicleSeatRows(damageFile.vehicleSeats, vehiclesFile.vehicles);

  it("names vehicles from the vehicle list", () => {
    expect(rows.map((row) => row.name)).toEqual(["Humvee", "Air.Rotary.ROT_01.Default", "Havoc"]);
  });

  it("spreads each rule's reduction over its arms classes", () => {
    expect(rows[2]?.reductions).toEqual({ Small: -90, Medium: -90, High: -50, Special: -60 });
    expect(rows[1]?.reductions).toEqual({ Small: -25, Medium: -25, High: -15, Special: null });
  });
});
