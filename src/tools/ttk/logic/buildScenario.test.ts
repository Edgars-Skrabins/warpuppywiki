import { describe, expect, it } from "vitest";
import { fixtureSources } from "../fixtures/sources";
import { DEFAULT_MATCHUP } from "../state";
import { armorOptions, buildScenario, defaultMagazine } from "./buildScenario";

describe("buildScenario", () => {
  it("builds an AK-family scenario from the default state", () => {
    const result = buildScenario(DEFAULT_MATCHUP, fixtureSources);
    if (!result.ok) throw new Error(result.error);
    expect(result.scenario.weapon.id).toBe("Id.Item.AK74M");
    expect(result.scenario.ammo.ammoType).toBe("FMJ");
    expect(result.scenario.distance).toBe(50);
    expect(result.scenario.pattern).toEqual(["Torso.Upper"]);
    expect(result.scenario.target).toEqual({ health: 100, body: null, helmet: null, extras: [] });
    expect(result.scenario.magazineCapacity).toBe(30);
    expect(result.scenario.pelletsPerShot).toBeUndefined();
  });

  it("picks the first magazine the slot lists when it names no default", () => {
    const weapon = fixtureSources.index.weapon("Id.Item.AK74M");
    if (weapon === undefined) throw new Error("No AK74M fixture");
    const options = fixtureSources.index.magazineOptions(weapon);
    const withoutDefault = {
      ...weapon,
      stats: { ...weapon.stats, slots: weapon.stats.slots.map((slot) => ({ ...slot, default: null })) },
    };
    expect(defaultMagazine(withoutDefault, [...options].reverse())?.attachment.id).toBe("Id.Item.AK74MMagazine");
  });

  it("reports an unknown weapon id", () => {
    expect(buildScenario({ ...DEFAULT_MATCHUP, weaponId: "Id.Item.Nope" }, fixtureSources)).toEqual({
      ok: false,
      error: "unknown-weapon",
      matchup: null,
    });
  });

  it("falls back to the first available ammo when the stored type is not offered", () => {
    const result = buildScenario({ ...DEFAULT_MATCHUP, ammoType: "Buckshot" }, fixtureSources);
    if (!result.ok) throw new Error(result.error);
    expect(result.scenario.ammo).toBe(result.matchup.ammoOptions[0]);
  });

  it("reports a custom placement without zones", () => {
    const result = buildScenario({ ...DEFAULT_MATCHUP, placement: "custom", custom: [] }, fixtureSources);
    expect(result.ok).toBe(false);
    expect(result.ok ? null : result.error).toBe("no-zones");
  });

  it("uses the custom zones in order", () => {
    const result = buildScenario(
      { ...DEFAULT_MATCHUP, placement: "custom", custom: ["Head", "Leg.Calf", "Head"] },
      fixtureSources,
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.scenario.pattern).toEqual(["Head", "Leg.Calf", "Head"]);
  });

  it("sets armor durability from the condition", () => {
    const result = buildScenario(
      { ...DEFAULT_MATCHUP, bodyArmorId: "Id.Item.HeavyArmor", helmetId: "Id.Item.LightHelmet", condition: 0.5 },
      fixtureSources,
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.scenario.target.body?.durability).toBe(125);
    expect(result.scenario.target.helmet?.durability).toBe(40);
  });

  it("passes the pellet count only for shotguns", () => {
    const result = buildScenario({ ...DEFAULT_MATCHUP, weaponId: "Id.Item.M500", pellets: 9 }, fixtureSources);
    if (!result.ok) throw new Error(result.error);
    expect(result.matchup.isShotgun).toBe(true);
    expect(result.scenario.pelletsPerShot).toBe(9);
  });

  it("orders armor options by level and keeps body armor and helmets apart", () => {
    const options = armorOptions(fixtureSources.equipment, fixtureSources.catalog);
    expect(options.body.map((armor) => armor.name)).toEqual([
      "Level 1 Armor",
      "Level 2 Armor",
      "Level 3 Armor",
      "Level 4 Armor",
    ]);
    expect(options.helmets.map((armor) => armor.name)).toEqual([
      "Level 1 Helmet",
      "Level 2 Helmet",
      "Level 3 Helmet",
      "Level 4 Helmet",
    ]);
  });
});
