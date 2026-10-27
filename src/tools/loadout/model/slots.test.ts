import { describe, expect, it } from "vitest";
import { catalog } from "../fixtures/testData";
import { itemsForSlot, slotDefinition, SLOT_DEFINITIONS } from "./slots";

describe("slots", () => {
  it("lists the seven slots in order", () => {
    expect(SLOT_DEFINITIONS.map((slot) => slot.label)).toEqual([
      "Primary",
      "Sidearm",
      "Specialist",
      "Body armor",
      "Helmet",
      "Vest",
      "Backpack",
    ]);
  });

  it("offers only player items carrying the slot tag", () => {
    const primaries = itemsForSlot(slotDefinition("primary"), catalog).map((item) => item.id);
    expect(primaries).toContain("Id.Item.M4");
    expect(primaries).not.toContain("Id.Item.ArtilleryBarrelTest");
    expect(primaries).not.toContain("ID.Item.BuildTool.Hammer.Large");
    expect(itemsForSlot(slotDefinition("specialist"), catalog).map((item) => item.name)).toEqual(["Large Hammer"]);
    expect(itemsForSlot(slotDefinition("armor"), catalog).map((item) => item.name)).toEqual([
      "Level 3 Armor",
      "Level 1 Armor",
      "Level 2 Armor",
      "Level 4 Armor",
    ]);
  });
});
