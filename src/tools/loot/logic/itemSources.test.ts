import { sameId } from "@/core/catalog";
import { describe, expect, it } from "vitest";
import { itemSources, tableMatches } from "./itemSources";
import { fixtureTable, fixtureTables } from "./testTables";

const byId = (id: string) => (itemId: string) => sameId(itemId, id);

describe("itemSources", () => {
  it("finds an item that appears only as an extra, with its chance", () => {
    expect(itemSources(fixtureTables, byId("Id.Item.StimPen"))).toEqual([
      { tableId: "AbandonedTower", itemId: "Id.Item.StimPen", chance: 0.125, asEntry: false, asExtra: true },
    ]);
  });

  it("adds up every entry that brings the item", () => {
    expect(itemSources(fixtureTables, byId("id.item.bandage"))).toEqual([
      { tableId: "AbandonedTower", itemId: "Id.Item.Bandage", chance: 0.25, asEntry: true, asExtra: false },
    ]);
  });

  it("weighs extras by their own chance", () => {
    const table = fixtureTable("AbandonedTower");
    const halfChance = {
      ...table,
      items: table.items.map((entry) => ({
        ...entry,
        subItems: entry.subItems.map((sub) => ({ ...sub, chance: 50 })),
      })),
    };
    expect(itemSources([halfChance], byId("Id.Item.StimPen"))[0]?.chance).toBe(0.0625);
  });

  it("lists each matching item once per table, most likely first", () => {
    const sources = itemSources(fixtureTables, (itemId) => /arrow|smoke/i.test(itemId));
    expect(sources.map((source) => [source.tableId, source.itemId])).toEqual([
      ["Bow", "Id.Item.Arrow"],
      ["AbandonedTower", "ID.Item.SmokeGrenade.White"],
    ]);
  });
});

describe("tableMatches", () => {
  const nameOf = (itemId: string) => (sameId(itemId, "Id.Item.M67Grenade") ? "M67 Frag Grenade" : itemId);

  it("matches by readable name or id", () => {
    expect(tableMatches(fixtureTable("AbandonedTower"), "abandoned t", nameOf)).toBe(true);
    expect(tableMatches(fixtureTable("AbandonedTower"), "abandonedtower", nameOf)).toBe(true);
  });

  it("matches by an item the table contains, including extras", () => {
    expect(tableMatches(fixtureTable("AbandonedTower"), "frag", nameOf)).toBe(true);
    expect(tableMatches(fixtureTable("Bow"), "frag", nameOf)).toBe(false);
  });

  it("matches everything for an empty query", () => {
    expect(tableMatches(fixtureTable("Bow"), "  ", nameOf)).toBe(true);
  });
});
