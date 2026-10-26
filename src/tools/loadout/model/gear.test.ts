import { describe, expect, it } from "vitest";
import { catalog, fixtureItem } from "../fixtures/testData";
import { gearItems, isGearItem } from "./gear";

describe("isGearItem", () => {
  it("counts quick-slot and utility items as gear", () => {
    expect(isGearItem(fixtureItem("Id.Item.Bandage"), catalog)).toBe(true);
    expect(isGearItem(fixtureItem("Id.Item.StimPen"), catalog)).toBe(true);
  });

  it("leaves out weapons and other items that fit a slot", () => {
    expect(isGearItem(fixtureItem("Id.Item.AK74M"), catalog)).toBe(false);
    expect(isGearItem(fixtureItem("ID.Item.BuildTool.Hammer.Large"), catalog)).toBe(false);
    expect(isGearItem(fixtureItem("Id.Item.MediumTacVest"), catalog)).toBe(false);
  });

  it("leaves out supply crates", () => {
    expect(isGearItem(fixtureItem("ID.Item.VehicleSupplyCrate.Small"), catalog)).toBe(false);
  });

  it("lists the gear items", () => {
    expect(gearItems(catalog).map((item) => item.name)).toEqual(["Bandage", "Stim Pen"]);
  });
});
