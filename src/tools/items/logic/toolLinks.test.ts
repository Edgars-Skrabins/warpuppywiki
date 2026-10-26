import { describe, expect, it } from "vitest";
import { testItem } from "../fixtures/gameData";
import { toolLinkFor } from "./toolLinks";

describe("toolLinkFor", () => {
  it("links weapons to the Arsenal with the weapon id", () => {
    expect(toolLinkFor(testItem("Id.Item.AK74M"), "weapons")).toEqual({
      label: "Open in Arsenal",
      to: "/arsenal?w=Id.Item.AK74M",
    });
  });

  it("links vehicles and armor to their tools", () => {
    expect(toolLinkFor(testItem("Vehicle.Variant.Land.Wheeled.Humvee.Default"), "vehicles")?.to).toBe("/vehicles");
    expect(toolLinkFor(testItem("Id.Item.HeavyHelmet"), "armor")?.to).toBe("/armor");
  });

  it("has no link for other categories", () => {
    expect(toolLinkFor(testItem("Id.Item.Bandage"), "utility")).toBeNull();
  });
});
