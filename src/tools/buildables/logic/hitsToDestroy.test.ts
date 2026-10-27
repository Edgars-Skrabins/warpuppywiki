import { describe, expect, it } from "vitest";
import type { DamageRule } from "@/core/data";
import { fixtureBuildable, fixtureCatalog, fixtureProjectiles, fixtureRules } from "../fixtures/testData";
import { rulesForEntity } from "./buildableRules";
import { DIRECT_HIT_TAG, hitsToDestroy, projectileOptions, type ProjectileOption } from "./hitsToDestroy";

const options = projectileOptions(fixtureProjectiles, fixtureCatalog);

function option(key: string): ProjectileOption {
  const found = options.find((candidate) => candidate.key.toLowerCase() === key.toLowerCase());
  if (!found) throw new Error(`No option ${key}`);
  return found;
}

const sandbag = fixtureBuildable("Sandbag Wall");
const sandbagRules = rulesForEntity(fixtureRules, sandbag.damageEntity ?? null);
const shelter = fixtureBuildable("Indirect Fire Shelter");
const shelterRules = rulesForEntity(fixtureRules, shelter.damageEntity ?? null);

describe("projectileOptions", () => {
  it("offers player ammo grouped as bullets and rockets", () => {
    expect(option("Id.Item.545mm.ArmorPiercing")).toMatchObject({
      group: "bullets",
      label: "5.45mm AP",
      tags: ["Bullet.545mm", "AmmoModifier.ArmorPiercing"],
    });
    expect(option("Id.Item.84mm")).toMatchObject({
      group: "rockets",
      label: "84mm",
      tags: ["Explosive.Rocket.84mm", DIRECT_HIT_TAG],
    });
    expect(options.findIndex((entry) => entry.group === "rockets")).toBeGreaterThan(
      options.findLastIndex((entry) => entry.group === "bullets"),
    );
  });
});

describe("hitsToDestroy", () => {
  it("applies bullet rules to bullets against a sandbag wall", () => {
    const fmj = hitsToDestroy(sandbag.maxHealth, option("Id.Item.545mm"), sandbagRules);

    expect(fmj.applied.map((rule) => rule.source)).toEqual(["Bullets"]);
    expect(fmj.factor).toBeCloseTo(0.15);
    expect(fmj.hits).toBe(Math.ceil(735 / (26 * 0.15)));

    const ap = hitsToDestroy(sandbag.maxHealth, option("Id.Item.545mm.ArmorPiercing"), sandbagRules);

    expect(ap.applied.map((rule) => rule.source).sort()).toEqual(["Armor-piercing bullets", "Bullets"]);
    expect(ap.factor).toBeCloseTo(0.3);
    expect(ap.hits).toBe(Math.ceil(735 / (26 * 0.3)));
  });

  it("applies rocket rules to an 84 mm rocket as a direct hit", () => {
    const wall = hitsToDestroy(sandbag.maxHealth, option("Id.Item.84mm"), sandbagRules);

    expect(wall.applied.map((rule) => rule.source)).toEqual(["Rockets"]);
    expect(wall.damage).toBeCloseTo(750);
    expect(wall.hits).toBe(1);

    const directHitRule: DamageRule = {
      ...shelterRules[0]!,
      source: ["Explosive.Rocket.84mm", DIRECT_HIT_TAG],
      amount: 100,
    };
    const bunker = hitsToDestroy(shelter.maxHealth, option("Id.Item.84mm"), [...shelterRules, directHitRule]);

    expect(bunker.applied.map((rule) => rule.source)).toEqual(["Rockets", "84 mm rockets (direct hit)"]);
    expect(bunker.hits).toBe(Math.ceil(5000 / (100 * 1.45 * 2)));
  });

  it("lists Add rules without applying them", () => {
    const crush: DamageRule = { ...sandbagRules[0]!, source: ["Explosive.Rocket"], operation: "Add", amount: 1000 };
    const result = hitsToDestroy(sandbag.maxHealth, option("Id.Item.93mm"), [...sandbagRules, crush]);

    expect(result.notApplied).toHaveLength(1);
    expect(result.notApplied[0]).toMatchObject({ kind: "flat", amount: 1000 });
    expect(result.damage).toBeCloseTo(110 * 7.5);
  });

  it("has no hit count when the rules cancel all damage", () => {
    const immune: DamageRule = { ...sandbagRules[0]!, source: ["Explosive.Rocket"], amount: -100 };

    expect(hitsToDestroy(sandbag.maxHealth, option("Id.Item.93mm"), [immune]).hits).toBeNull();
  });

  it("has no hit count when the buildable has no usable health", () => {
    expect(hitsToDestroy(0, option("Id.Item.93mm"), []).hits).toBeNull();
    expect(hitsToDestroy(Number.NaN, option("Id.Item.93mm"), []).hits).toBeNull();
  });
});
