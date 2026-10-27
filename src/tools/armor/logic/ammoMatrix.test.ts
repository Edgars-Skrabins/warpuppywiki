import { describe, expect, it } from "vitest";
import { fixtureCatalog, fixtureDamage, fixtureEquipment } from "../fixtures/testData";
import { fixtureAmmo, fixtureWeapon, fixtureWeaponIndex } from "../fixtures/weaponData";
import {
  ammoMatrix,
  bulletAmmo,
  defaultReferenceWeapon,
  effectiveReduction,
  matrixColumns,
  referenceWeapons,
} from "./ammoMatrix";
import { armorRows } from "./armorRows";

const columns = matrixColumns(armorRows(fixtureEquipment.armor, fixtureCatalog, "body"));
const m4 = fixtureWeapon("Id.Item.M4");

function column(label: string) {
  const found = columns.find((candidate) => candidate.label === label);
  if (!found) throw new Error(`No column ${label}`);
  return found;
}

describe("matrixColumns", () => {
  it("is None then the four protective levels, without the ghillie", () => {
    expect(columns.map((entry) => entry.label)).toEqual([
      "None",
      "Level 1 Armor",
      "Level 2 Armor",
      "Level 3 Armor",
      "Level 4 Armor",
    ]);
  });
});

describe("referenceWeapons", () => {
  it("defaults to the M4 among player bullet weapons", () => {
    const weapons = referenceWeapons(fixtureWeaponIndex);
    expect(weapons.length).toBeGreaterThan(0);
    expect(defaultReferenceWeapon(weapons)?.id).toBe("Id.Item.M4");
  });
});

describe("effectiveReduction", () => {
  const level3 = column("Level 3 Armor").armor;

  it("scales AP by the medium arms class", () => {
    expect(effectiveReduction(fixtureDamage, level3, fixtureAmmo(m4, "ArmorPiercing"))).toBeCloseTo(0.3);
  });

  it("strengthens armor against HP", () => {
    expect(effectiveReduction(fixtureDamage, level3, fixtureAmmo(m4, "HollowPoint"))).toBeCloseTo(0.75);
  });

  it("is zero without armor", () => {
    expect(effectiveReduction(fixtureDamage, null, fixtureAmmo(m4, "FMJ"))).toBe(0);
  });
});

describe("ammoMatrix", () => {
  const rows = ammoMatrix({
    damage: fixtureDamage,
    weapon: m4,
    ammoOptions: bulletAmmo(fixtureWeaponIndex, m4),
    columns,
  });

  it("has a row per ammo type and a cell per column", () => {
    expect(rows).toHaveLength(6);
    expect(rows.every((row) => row.cells.length === columns.length)).toBe(true);
  });

  it("needs more shots for FMJ as the armor level rises", () => {
    const fmj = rows.find((row) => row.ammo.ammoType === "FMJ");
    const stks = fmj?.cells.map((cell) => cell.stk) ?? [];
    expect(stks.every((stk) => stk !== null)).toBe(true);
    for (let index = 1; index < stks.length; index++) {
      expect(stks[index]!).toBeGreaterThanOrEqual(stks[index - 1]!);
    }
    expect(stks.at(-1)!).toBeGreaterThan(stks[0]!);
  });
});
