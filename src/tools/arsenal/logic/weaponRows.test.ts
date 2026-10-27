import { describe, expect, it } from "vitest";
import { testData, testWeapon } from "../fixtures/testData";
import { DEFAULT_FILTERS } from "../state";
import { filterRows, fullDamageRange, rawDps, weaponRow, weaponRows } from "./weaponRows";

const rows = weaponRows(testData);

function names(list: readonly { name: string }[]): string[] {
  return list.map((row) => row.name);
}

describe("weaponRow", () => {
  it("builds the AK74 row from its FMJ round", () => {
    const row = weaponRow(testData, testWeapon("Id.Item.AK74M"));
    expect(row).toMatchObject({
      name: "AK74",
      archetypeId: "AR",
      calibers: [{ id: "545mm", label: "545mm" }],
      damage: 26,
      rpm: 650,
      muzzleVelocity: 880,
      effectiveRange: 500,
      fullDamageRange: 500,
      adsTime: 0.8,
      stk: 5,
    });
    expect(row.dps).toBeCloseTo(281.67, 2);
  });

  it("uses the last full-damage falloff point", () => {
    expect(fullDamageRange(testWeapon("Id.Item.WEPN_028"))).toBe(200);
    expect(fullDamageRange(testWeapon("Id.Item.M500"))).toBeNull();
  });

  it("has no DPS when the fire rate is missing", () => {
    expect(rawDps(26, null)).toBeNull();
    expect(rawDps(null, 650)).toBeNull();
    const weapon = testWeapon("Id.Item.AK74M");
    const noRpm = { ...weapon, stats: { ...weapon.stats, rpm: null } };
    expect(weaponRow(testData, noRpm)).toMatchObject({ rpm: null, dps: null, stk: 5 });
  });
});

describe("weaponRows", () => {
  it("lists player weapons sorted by archetype, then name", () => {
    expect(names(rows)).toEqual(["AK74", "M4", "MP5", "Mosin Nagant", "SV98", "M500"]);
  });
});

describe("filterRows", () => {
  it("filters by archetype", () => {
    expect(names(filterRows(rows, { ...DEFAULT_FILTERS, archetypes: ["smg", "Shotgun"] }))).toEqual(["MP5", "M500"]);
  });

  it("filters by inventory slot", () => {
    expect(filterRows(rows, { ...DEFAULT_FILTERS, slots: ["Primary"] })).toHaveLength(rows.length);
    expect(filterRows(rows, { ...DEFAULT_FILTERS, slots: ["Sidearm"] })).toEqual([]);
  });

  it("searches names and calibers", () => {
    expect(names(filterRows(rows, { ...DEFAULT_FILTERS, query: "762X54" }))).toEqual(["Mosin Nagant", "SV98"]);
    expect(names(filterRows(rows, { ...DEFAULT_FILTERS, query: "9mm" }))).toEqual(["MP5"]);
    expect(names(filterRows(rows, { ...DEFAULT_FILTERS, query: "mosin" }))).toEqual(["Mosin Nagant"]);
  });
});
