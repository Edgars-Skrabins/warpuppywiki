import { describe, expect, it } from "vitest";
import { testCatalog } from "../fixtures/gameData";
import { searchItems } from "./itemSearch";

function names(query: string) {
  return searchItems(testCatalog.items, query).map((item) => item.name);
}

describe("searchItems", () => {
  it("matches every word in any order", () => {
    expect(names("magazine ak74 60")).toEqual(["AK74 60 RND Magazine"]);
    expect(names("60 ak74 magazine")).toEqual(["AK74 60 RND Magazine"]);
  });

  it("ignores case", () => {
    expect(names("BANDAGE")).toEqual(["Bandage"]);
  });

  it("matches the description, subtitle and id", () => {
    expect(names("teammates")).toEqual(["Bandage"]);
    expect(names("sniper rifle").sort()).toEqual(["Mosin Nagant", "SV98"]);
    expect(names("wepn_028")).toEqual(["MP5"]);
  });

  it("returns everything for an empty query", () => {
    expect(searchItems(testCatalog.items, "  ")).toHaveLength(testCatalog.items.length);
  });
});
