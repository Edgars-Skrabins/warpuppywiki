import { describe, expect, it } from "vitest";
import { testCatalog, testItem } from "../fixtures/gameData";
import { buildEntries, filterEntries, itemName, unitPriceOf } from "./itemEntries";

const entries = buildEntries(testCatalog);

function ids(filter: Parameters<typeof filterEntries>[1]) {
  return filterEntries(entries, filter).map((entry) => entry.item.id);
}

describe("buildEntries", () => {
  it("sorts by name", () => {
    const names = entries.map((entry) => entry.item.name);
    expect(names.indexOf("5.45mm")).toBeLessThan(names.indexOf("AK74"));
    expect(names.indexOf("Bandage")).toBeLessThan(names.indexOf("Humvee"));
  });

  it("uses the item's own vendor price, then its first variation", () => {
    const byId = new Map(entries.map((entry) => [entry.item.id, entry]));
    expect(byId.get("Id.Item.545mm.HollowPoint")?.price).toMatchObject({ price: 25, amount: 10, unitPrice: 2.5 });
    expect(byId.get("Id.Item.AK74M")?.price).toBeNull();
  });
});

describe("filterEntries", () => {
  it("hides non-player items unless asked", () => {
    expect(ids({ query: "artillery", category: "all", showNonPlayer: false })).toEqual([]);
    expect(ids({ query: "artillery", category: "all", showNonPlayer: true })).toEqual(["Id.Item.ArtilleryBarrelTest"]);
  });

  it("combines category and search", () => {
    expect(ids({ query: "level 1", category: "armor", showNonPlayer: false }).sort()).toEqual([
      "Id.Item.LightArmor",
      "Id.Item.LightHelmet",
    ]);
    expect(ids({ query: "level 1", category: "weapons", showNonPlayer: false })).toEqual([]);
  });
});

describe("display guards", () => {
  it("falls back to the id for a blank name", () => {
    expect(itemName({ ...testItem("Id.Item.Bandage"), name: "  " })).toBe("Id.Item.Bandage");
    expect(itemName(testItem("Id.Item.Bandage"))).toBe("Bandage");
  });

  it("has no unit price for a lot of zero", () => {
    expect(unitPriceOf({ price: 10, amount: 0, unitPrice: Infinity, soldWith: "x", categories: [] })).toBeNull();
    expect(unitPriceOf(null)).toBeNull();
  });
});
