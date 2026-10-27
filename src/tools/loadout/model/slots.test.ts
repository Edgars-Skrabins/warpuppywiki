import { describe, expect, it } from "vitest";
import { catalog } from "../fixtures/testData";
import { itemsForSlot, slotDefinition } from "./slots";

describe("slots", () => {
  it("offers only player items carrying the slot tag", () => {
    const primaries = itemsForSlot(slotDefinition("primary"), catalog).map((item) => item.id);
    expect(primaries).toContain("Id.Item.M4");
    expect(primaries).not.toContain("Id.Item.ArtilleryBarrelTest");
    expect(primaries).not.toContain("ID.Item.BuildTool.Hammer.Large");
    expect(itemsForSlot(slotDefinition("specialist"), catalog).map((item) => item.name)).toEqual([
      "Large Hammer",
      "RPG-7",
    ]);
    expect(itemsForSlot(slotDefinition("armor"), catalog).map((item) => item.name)).toEqual([
      "Level 3 Armor",
      "Level 1 Armor",
      "Level 2 Armor",
      "Level 4 Armor",
    ]);
  });
});
