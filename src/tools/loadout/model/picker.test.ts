import { describe, expect, it } from "vitest";
import { catalog } from "../fixtures/testData";
import { pickerGroups } from "./picker";
import { itemsForSlot, slotDefinition } from "./slots";

const primaries = itemsForSlot(slotDefinition("primary"), catalog);

function names(groups: ReturnType<typeof pickerGroups>) {
  return groups.map((group) => [group.label, group.options.map((option) => option.item.name)]);
}

describe("pickerGroups", () => {
  it("groups weapons by archetype, sorted by name", () => {
    expect(names(pickerGroups(primaries, catalog, { search: "", sort: "name", groupByArchetype: true }))).toEqual([
      ["Assault Rifle", ["AK74", "M4"]],
      ["Shotgun", ["M500"]],
      ["SMG", ["MP5"]],
      ["Sniper Rifle", ["Mosin Nagant", "SV98"]],
    ]);
  });

  it("sorts by price with unsold items last", () => {
    const groups = pickerGroups(primaries, catalog, { search: "", sort: "price", groupByArchetype: false });
    expect(names(groups)).toEqual([["All", ["MP5", "M4", "Mosin Nagant", "SV98", "AK74", "M500"]]]);
  });

  it("sorts by weight", () => {
    const groups = pickerGroups(primaries, catalog, { search: "", sort: "weight", groupByArchetype: false });
    expect(groups[0]?.options.map((option) => option.weight)).toEqual([2.54, 2.92, 3, 3.52, 4.1, 5.8]);
  });

  it("filters by name, subtitle or archetype, ignoring case", () => {
    expect(names(pickerGroups(primaries, catalog, { search: "sniper", sort: "name", groupByArchetype: true }))).toEqual(
      [["Sniper Rifle", ["Mosin Nagant", "SV98"]]],
    );
    expect(pickerGroups(primaries, catalog, { search: "nothing", sort: "name", groupByArchetype: false })).toEqual([]);
  });
});
