import { describe, expect, it } from "vitest";
import { metaFile } from "../fixtures/testData";
import { emptyLoadout, MAX_GEAR_QUANTITY, setGearQuantity, setSlotItem, slotItemId, startingBudget } from "./loadout";

describe("loadout model", () => {
  it("takes the starting budget from the Cash currency", () => {
    expect(startingBudget(metaFile)).toBe(10_000);
  });

  it("stores weapon slots as setups and equipment slots as ids", () => {
    const loadout = setSlotItem(setSlotItem(emptyLoadout(0), "primary", "Id.Item.M4"), "helmet", "Id.Item.LightHelmet");
    expect(loadout.slots.primary).toEqual({ itemId: "Id.Item.M4", attachments: {}, magazine: null, looseAmmo: null });
    expect(loadout.slots.helmet).toBe("Id.Item.LightHelmet");
    expect(slotItemId(loadout, "primary")).toBe("Id.Item.M4");
    expect(slotItemId(setSlotItem(loadout, "primary", null), "primary")).toBeNull();
  });

  it("adds, updates, clamps and removes gear", () => {
    let loadout = setGearQuantity(emptyLoadout(0), "Id.Item.Bandage", 2);
    loadout = setGearQuantity(loadout, "id.item.bandage", 50);
    expect(loadout.gear).toEqual([{ itemId: "Id.Item.Bandage", quantity: MAX_GEAR_QUANTITY }]);
    expect(setGearQuantity(loadout, "Id.Item.Bandage", 0).gear).toEqual([]);
  });
});
