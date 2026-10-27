import { describe, expect, it } from "vitest";
import { fixtureArmor, fixtureDamage } from "../fixtures/testData";
import { fixtureAmmo, fixtureWeapon } from "../fixtures/weaponData";
import { MAX_WEAR_HITS, wearSeries } from "./wearSeries";

const m4 = fixtureWeapon("Id.Item.M4");
const level3 = fixtureArmor("Level 3 Armor");

describe("wearSeries", () => {
  const series = wearSeries({ damage: fixtureDamage, weapon: m4, ammo: fixtureAmmo(m4, "FMJ"), armor: level3 });
  const perHit = 28 * 0.885 * 0.4;

  it("wears the armor by the armor damage of each hit", () => {
    expect(series.points[0]?.armorDamage).toBeCloseTo(perHit);
    expect(series.points[0]?.durability).toBeCloseTo(250 - perHit);
    series.points.slice(1).forEach((point, index) => {
      const previous = series.points[index]!;
      expect(point.durability).toBeCloseTo(Math.max(0, previous.durability - point.armorDamage));
    });
  });

  it("marks the shots where the wear stage changes", () => {
    expect(series.stageChanges).toEqual([
      { hit: Math.ceil(62.5 / perHit), stage: 1 },
      { hit: Math.ceil(125 / perHit), stage: 2 },
      { hit: Math.ceil(187.5 / perHit), stage: 3 },
    ]);
  });

  it("stops when the armor is spent", () => {
    expect(series.spentAt).toBe(Math.ceil(250 / perHit));
    expect(series.points).toHaveLength(series.spentAt!);
    expect(series.points.at(-1)?.durability).toBe(0);
  });

  it("caps the series at 40 hits", () => {
    const tough = { ...level3, durability: 100000 };
    const capped = wearSeries({ damage: fixtureDamage, weapon: m4, ammo: fixtureAmmo(m4, "FMJ"), armor: tough });
    expect(capped.points).toHaveLength(MAX_WEAR_HITS);
    expect(capped.spentAt).toBeNull();
  });

  it("is empty for armor without durability", () => {
    const ghillie = { ...level3, durability: null };
    expect(
      wearSeries({ damage: fixtureDamage, weapon: m4, ammo: fixtureAmmo(m4, "FMJ"), armor: ghillie }).points,
    ).toEqual([]);
  });
});
