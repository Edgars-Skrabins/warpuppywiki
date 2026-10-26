import { describe, expect, it } from "vitest";
import { testCatalog, testItem } from "../fixtures/gameData";
import { categoryOf } from "./itemCategory";

function category(id: string) {
  return categoryOf(testItem(id), testCatalog);
}

describe("categoryOf", () => {
  it.each([
    ["Id.Item.AK74M", "weapons"],
    ["Id.Item.AK74MMagazine", "magazines"],
    ["Id.Item.3xScope", "attachments"],
    ["Id.Item.545mm.HollowPoint", "ammo"],
    ["Id.Item.HeavyArmor", "armor"],
    ["Id.Item.LightHelmet", "armor"],
    ["Id.Item.SmallBackpack", "carry"],
    ["Id.Item.SmallTacVest", "carry"],
    ["Vehicle.Variant.Land.Wheeled.Humvee.Default", "vehicles"],
    ["Id.Item.Bandage", "utility"],
  ])("puts %s in %s", (id, expected) => {
    expect(category(id)).toBe(expected);
  });

  it("needs a weapon slot as well as an archetype for weapons", () => {
    const ak = testItem("Id.Item.AK74M");
    expect(categoryOf({ ...ak, tags: ["Item.Archetype.Parachute", "Inventory.Slot.Traversal"] }, testCatalog)).toBe(
      "other",
    );
    expect(categoryOf({ ...ak, tags: ["Item.Archetype.Launcher", "Inventory.Slot.Specialist"] }, testCatalog)).toBe(
      "weapons",
    );
  });

  it("uses the utility vendor category without a quick slot tag", () => {
    const bandage = testItem("Id.Item.Bandage");
    expect(categoryOf({ ...bandage, tags: [] }, testCatalog)).toBe("utility");
    expect(categoryOf({ ...bandage, tags: [], vendor: [] }, testCatalog)).toBe("other");
  });
});
