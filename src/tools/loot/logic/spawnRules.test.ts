import { describe, expect, it } from "vitest";
import { spawnRules } from "./spawnRules";
import { fixtureTable } from "./testTables";

describe("spawnRules", () => {
  it("describes every rule of the abandoned tower", () => {
    expect(spawnRules(fixtureTable("AbandonedTower"))).toEqual([
      "Spawns 50% of the time",
      "Only inside the control zone",
      "First spawn after 0 s",
      "Paced by spawn points (starts with 10)",
      "Respawns after 300 s",
      "Never repeats the previous item",
    ]);
  });

  it("describes a plain weapon table", () => {
    expect(spawnRules(fixtureTable("Bow"))).toEqual(["Always spawns", "First spawn after 0 s", "Respawns after 1 s"]);
  });

  it("leaves out a missing respawn time", () => {
    expect(spawnRules({ ...fixtureTable("Bow"), respawnTime: null })).toContain("Respawns");
  });

  it("says when a table never respawns", () => {
    expect(spawnRules({ ...fixtureTable("Bow"), canRespawn: false })).toContain("Does not respawn");
  });
});
