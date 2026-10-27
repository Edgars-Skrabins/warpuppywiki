import { describe, expect, it } from "vitest";
import { catalog, damageFile, equipmentFile, weaponIndex } from "../fixtures/testData";
import { emptyLoadout, setSlotItem, setWeaponSetup, type Loadout } from "../model/loadout";
import { defaultSetup } from "../model/weaponSetup";
import { compareLoadouts, textDifference, type CompareModel, type CompareRow } from "./compareModel";

const model: CompareModel = { catalog, index: weaponIndex, damage: damageFile, equipment: equipmentFile };
const target = { targetArmor: 2, targetHelmet: 1, placement: "upper-chest" as const };
const threat = { weaponId: "Id.Item.M4", ammoType: null, placement: "upper-chest" as const };

const light: Loadout = setSlotItem(
  setWeaponSetup(emptyLoadout(10_000), "primary", defaultSetup("Id.Item.AK74M", weaponIndex, catalog)),
  "armor",
  "Id.Item.LightArmor",
);
const heavy: Loadout = setSlotItem(
  setSlotItem(
    setWeaponSetup(emptyLoadout(10_000), "primary", defaultSetup("Id.Item.M4", weaponIndex, catalog)),
    "armor",
    "Id.Item.SuperHeavyArmor",
  ),
  "helmet",
  "Id.Item.SuperHeavyHelmet",
);

function rowsOf(a: Loadout, b: Loadout): CompareRow[] {
  return compareLoadouts(a, b, model, target, threat).flatMap((section) => section.rows);
}

function find(rows: CompareRow[], key: string): CompareRow {
  const found = rows.find((candidate) => candidate.key === key);
  if (found === undefined) {
    throw new Error(`No row ${key}`);
  }
  return found;
}

describe("compareLoadouts", () => {
  it("shows every difference as equal when a loadout is compared with itself", () => {
    const rows = rowsOf(heavy, heavy);
    for (const row of rows) {
      expect(row.delta === null || row.delta === 0).toBe(true);
      expect(textDifference(row)).not.toBe("different");
    }
    expect(rows.some((row) => row.delta === 0)).toBe(true);
  });

  it("marks the cheaper side as better on cost", () => {
    const total = find(rowsOf(heavy, light), "total");
    expect(total.betterWhen).toBe("lower");
    expect(total.delta).toBeLessThan(0);
    expect(find(rowsOf(heavy, light), "armor").delta).toBe(
      (catalog.price("Id.Item.LightArmor")?.price ?? 0) -
        (catalog.price("Id.Item.SuperHeavyArmor")?.price ?? 0) -
        (catalog.price("Id.Item.SuperHeavyHelmet")?.price ?? 0),
    );
  });

  it("gives heavier armor more shots to survive and a worse top speed", () => {
    const rows = rowsOf(light, heavy);
    expect(find(rows, "survival-100").delta).toBeGreaterThan(0);
    expect(find(rows, "survival-100").betterWhen).toBe("higher");
    const topSpeed = find(rows, "Movement.MaxSpeedMultiplier");
    expect(topSpeed.betterWhen).toBe("higher");
    expect(topSpeed.delta).toBeLessThan(0);
  });

  it("shows a dash and no difference for an empty slot", () => {
    const rows = rowsOf(light, emptyLoadout(10_000));
    const ads = find(rows, "primary-ads");
    expect(ads.b.value).toBeNull();
    expect(ads.delta).toBeNull();
    expect(find(rows, "primary-weapon").b.text).toBeNull();
    expect(textDifference(find(rows, "primary-weapon"))).toBeNull();
  });

  it("leaves out weapon slots that are empty on both sides", () => {
    const keys = rowsOf(light, heavy).map((row) => row.key);
    expect(keys).toContain("primary-ads");
    expect(keys.some((key) => key.startsWith("sidearm-"))).toBe(false);
  });

  it("lists protection details from the game data", () => {
    const rows = rowsOf(light, heavy);
    expect(find(rows, "armor-durability")).toMatchObject({ a: { value: 200 }, b: { value: 300 } });
    expect(find(rows, "armor-reduction")).toMatchObject({ a: { value: 0.3 }, b: { value: 0.6 } });
    expect(find(rows, "armor-zones").b.text).toBe("Stomach, Center mass, Upper chest, Pelvis, Upper arm");
  });
});
