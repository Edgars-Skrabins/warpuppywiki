import { describe, expect, it } from "vitest";
import { damageFile } from "../fixtures/gameData";
import {
  entitiesInGroup,
  filterRules,
  indexRules,
  sortRules,
  type IndexedRule,
  type RuleFilterState,
} from "./ruleFilters";

const rules = indexRules(damageFile.rules);

const allRules: RuleFilterState = {
  group: null,
  entity: null,
  categories: [],
  source: "",
  nonZero: false,
  hideFriendly: false,
};

function indexes(rows: readonly IndexedRule[]): number[] {
  return rows.map((row) => row.index);
}

describe("filterRules", () => {
  it("keeps every rule with all filters off", () => {
    expect(filterRules(rules, allRules)).toHaveLength(damageFile.rules.length);
  });

  it("keeps rule indexes from the file", () => {
    const filtered = filterRules(rules, { ...allRules, source: "Bullet.Arrow" });
    expect(indexes(filtered)).toEqual([30, 31, 32, 33, 34, 35, 36]);
  });

  it("filters by entity group", () => {
    const armor = filterRules(rules, { ...allRules, group: "armor" });
    expect(new Set(armor.map(({ rule }) => rule.entity))).toEqual(new Set(["Armor", "Helmet"]));
    const vehicles = filterRules(rules, { ...allRules, group: "vehicles" });
    expect(new Set(vehicles.map(({ rule }) => rule.entity))).toEqual(new Set(["Vehicle.Air.Rotary.Havoc"]));
    const other = filterRules(rules, { ...allRules, group: "other" });
    expect(other.map(({ rule }) => rule.entity)).toEqual(["Vehicle.SupplyCrate"]);
  });

  it("filters by a specific entity, ignoring case", () => {
    const helmet = filterRules(rules, { ...allRules, entity: "helmet" });
    expect(helmet).toHaveLength(8);
    expect(helmet.every(({ rule }) => rule.entity === "Helmet")).toBe(true);
  });

  it("filters by any of the selected categories", () => {
    const filtered = filterRules(rules, { ...allRules, group: "infantry", categories: ["Tracer", "Friendly"] });
    expect(indexes(filtered)).toEqual([20, 21, 24, 26, 27, 28, 29]);
  });

  it("does not treat a category as a parent of a longer one", () => {
    const filtered = filterRules(rules, { ...allRules, categories: ["Penetration"] });
    expect(filtered.every(({ rule }) => rule.category === "Penetration")).toBe(true);
    expect(indexes(filtered)).toEqual([5, 14, 101, 102]);
  });

  it("searches source tags by substring, ignoring case", () => {
    const filtered = filterRules(rules, { ...allRules, group: "infantry", source: "hollowpoint" });
    expect(indexes(filtered)).toEqual([25, 26, 27, 28, 92, 93]);
    expect(indexes(filterRules(rules, { ...allRules, source: "84mm" }))).toEqual([77, 78]);
  });

  it("hides rules with a zero amount when only non-zero is on", () => {
    const filtered = filterRules(rules, { ...allRules, nonZero: true });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.some(({ rule }) => rule.amount === 0)).toBe(false);
    expect(indexes(filtered)).not.toContain(24);
  });

  it("hides friendly-fire rules when asked", () => {
    const filtered = filterRules(rules, { ...allRules, hideFriendly: true });
    expect(indexes(filtered)).not.toContain(20);
    expect(indexes(filtered)).not.toContain(21);
    expect(filtered).toHaveLength(damageFile.rules.length - 2);
  });
});

describe("entitiesInGroup", () => {
  it("lists each entity of the group once, in file order", () => {
    expect(entitiesInGroup(damageFile.rules, "armor")).toEqual(["Armor", "Helmet"]);
    expect(entitiesInGroup(damageFile.rules, "buildables")).toEqual(["Buildable.FOB", "Buildable.Door"]);
  });

  it("lists every entity without a group", () => {
    expect(entitiesInGroup(damageFile.rules, null)).toHaveLength(7);
  });
});

describe("sortRules", () => {
  const sample = filterRules(rules, { ...allRules, entity: "Armor" });

  it("keeps file order by default", () => {
    expect(indexes(sortRules(sample, { key: "file", descending: false }))).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("sorts by amount with file order breaking ties", () => {
    expect(indexes(sortRules(sample, { key: "amount", descending: false }))).toEqual([7, 4, 8, 2, 6, 0, 5, 3, 1]);
    expect(indexes(sortRules(sample, { key: "amount", descending: true }))).toEqual([1, 3, 5, 0, 6, 2, 8, 4, 7]);
  });

  it("sorts by entity", () => {
    const mixed = filterRules(rules, { ...allRules, source: "Bullet.12g.7mmBuckshot" });
    expect(sortRules(mixed, { key: "entity", descending: false }).map(({ rule }) => rule.entity)).toEqual([
      "Armor",
      "Helmet",
      "Infantry",
      "Infantry",
      "Infantry",
      "Infantry",
    ]);
  });
});
