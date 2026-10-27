import { describe, expect, it } from "vitest";
import type { EntityDiff } from "./diff/types";
import { defaultBuilds, filterEntities, patchSearch, readPatchState, writePatchState } from "./state";

const builds = [
  { build: "25677108", publishedAt: "2026-10-10T14:09:49Z" },
  { build: "25937608", publishedAt: "2026-10-15T19:57:06Z" },
  { build: "25500000", publishedAt: "2026-10-01T10:00:00Z" },
];

describe("defaultBuilds", () => {
  it("compares the second-newest build with the newest", () => {
    expect(defaultBuilds(builds)).toEqual({ from: "25677108", to: "25937608" });
  });

  it("returns null with fewer than two builds", () => {
    expect(defaultBuilds(builds.slice(0, 1))).toBeNull();
    expect(defaultBuilds([])).toBeNull();
  });
});

describe("readPatchState", () => {
  it("uses defaults for missing or unknown values", () => {
    expect(readPatchState(new URLSearchParams("from=1&c=nope&f=odd"), builds)).toEqual({
      from: "25677108",
      to: "25937608",
      category: null,
      entity: null,
      filter: "all",
      search: "",
      showAssets: false,
    });
  });

  it("round-trips through writePatchState", () => {
    const state = {
      from: "25500000",
      to: "25677108",
      category: "weapons",
      entity: "weapon:id.item.ak74m",
      filter: "changed" as const,
      search: "ak",
      showAssets: true,
    };
    const params = writePatchState(state);
    expect(params.toString()).toBe(
      "from=25500000&to=25677108&c=weapons&e=weapon%3Aid.item.ak74m&f=changed&q=ak&assets=1",
    );
    expect(readPatchState(params, builds)).toEqual(state);
  });

  it("ignores an entity without a category", () => {
    expect(readPatchState(new URLSearchParams("e=weapon%3Aak"), builds)?.entity).toBeNull();
  });
});

describe("filterEntities", () => {
  const entities: EntityDiff[] = [
    { key: "weapon:id.item.ak74m", name: "AK74", status: "changed", changes: [] },
    { key: "weapon:id.item.wepn_031", name: "PP-19 Bizon", status: "added", changes: [] },
    { key: "weapon:id.item.judge", name: "Judge", status: "removed", changes: [] },
  ];

  it("filters by status", () => {
    expect(filterEntities(entities, "added", "").map((entity) => entity.name)).toEqual(["PP-19 Bizon"]);
  });

  it("searches names and ids case-insensitively", () => {
    expect(filterEntities(entities, "all", "bizon").map((entity) => entity.name)).toEqual(["PP-19 Bizon"]);
    expect(filterEntities(entities, "all", "WEPN_031").map((entity) => entity.name)).toEqual(["PP-19 Bizon"]);
    expect(filterEntities(entities, "changed", "bizon")).toEqual([]);
  });
});

describe("patchSearch", () => {
  it("builds a link to an entity's detail view", () => {
    const state = readPatchState(new URLSearchParams("q=old"), builds)!;
    expect(patchSearch(state, { category: "weapons", entity: "weapon:m4", search: "" })).toBe(
      "?from=25677108&to=25937608&c=weapons&e=weapon%3Am4",
    );
  });
});
