import { describe, expect, it } from "vitest";
import { damageFile, equipmentFile, weaponIndex } from "../fixtures/testData";
import { emptyLoadout, setLethalityView, setSlotItem, setWeaponSetup, WeaponSetup, type Loadout } from "./loadout";
import { armorForLevel, armorRows, weaponRows, type LethalityModel } from "./lethality";

const model: LethalityModel = { index: weaponIndex, damage: damageFile, equipment: equipmentFile };

function withPrimary(setup: Partial<WeaponSetup> & { itemId: string }): Loadout {
  return setWeaponSetup(emptyLoadout(0), "primary", WeaponSetup.parse(setup));
}

describe("armorForLevel", () => {
  it("finds armor and helmets by their level", () => {
    expect(armorForLevel(equipmentFile, "Armor", 3)?.id).toBe("Id.Item.HeavyArmor");
    expect(armorForLevel(equipmentFile, "Helmet", 1)?.id).toBe("Id.Item.LightHelmet");
    expect(armorForLevel(equipmentFile, "Armor", 0)).toBeNull();
    expect(armorForLevel(equipmentFile, "Armor", 9)).toBeNull();
  });
});

describe("weaponRows", () => {
  it("uses the loaded magazine's ammo type", () => {
    const loadout = withPrimary({
      itemId: "Id.Item.AK74M",
      magazine: { id: "Id.Item.AK74MMagazine", ammoType: "ArmorPiercing", count: 4 },
    });
    const [row] = weaponRows(loadout, model);
    expect(row?.ammo.ammoType).toBe("ArmorPiercing");
    expect(row?.assumedAmmo).toBe(false);
    expect(row?.magazineId).toBe("Id.Item.AK74MMagazine");
    expect(row?.points.map((point) => point.distance)).toEqual([25, 100, 300]);
    expect(row?.points.every((point) => point.stk !== null)).toBe(true);
  });

  it("assumes FMJ when no ammo is bought", () => {
    const [row] = weaponRows(withPrimary({ itemId: "Id.Item.AK74M" }), model);
    expect(row?.ammo.ammoType).toBe("FMJ");
    expect(row?.assumedAmmo).toBe(true);
  });

  it("marks a launcher as not modeled", () => {
    const loadout = setWeaponSetup(emptyLoadout(0), "specialist", WeaponSetup.parse({ itemId: "Id.Item.RPG7" }));
    const [row] = weaponRows(loadout, model);
    expect(row?.weapon.id).toBe("Id.Item.RPG7");
    expect(row?.modeled).toBe(false);
    expect(row?.points).toEqual([]);
  });

  it("needs more shots against heavier target armor", () => {
    const loadout = withPrimary({ itemId: "Id.Item.AK74M" });
    const none = weaponRows(setLethalityView(loadout, { targetArmor: 0, targetHelmet: 0 }), model)[0];
    const heavy = weaponRows(setLethalityView(loadout, { targetArmor: 4 }), model)[0];
    expect(heavy?.points[1]?.stk).toBeGreaterThan(none?.points[1]?.stk ?? Infinity);
  });

  it("skips slots without a weapon that fires ammo", () => {
    const loadout = setSlotItem(emptyLoadout(0), "specialist", "ID.Item.BuildTool.Hammer.Large");
    expect(weaponRows(loadout, model)).toEqual([]);
  });
});

describe("armorRows", () => {
  it("shows more shots to kill with Level 3 armor than without", () => {
    const loadout = setSlotItem(emptyLoadout(0), "armor", "Id.Item.HeavyArmor");
    const comparison = armorRows(loadout, model);
    expect(comparison?.weapon.id).toBe("Id.Item.M4");
    expect(comparison?.bodyArmor?.id).toBe("Id.Item.HeavyArmor");
    for (const row of comparison?.rows ?? []) {
      expect(row.extraShots).toBeGreaterThan(0);
      expect(row.armored.stk).toBe((row.unarmored.stk ?? 0) + (row.extraShots ?? 0));
    }
    expect(comparison?.rows).toHaveLength(3);
  });

  it("shows no difference without armor", () => {
    const comparison = armorRows(emptyLoadout(0), model);
    expect(comparison?.rows.map((row) => row.extraShots)).toEqual([0, 0, 0]);
  });

  it("uses the chosen threat ammo type", () => {
    const loadout = setLethalityView(emptyLoadout(0), {
      threatWeaponId: "Id.Item.AK74M",
      threatAmmoType: "HollowPoint",
    });
    expect(armorRows(loadout, model)?.ammo.ammoType).toBe("HollowPoint");
  });
});
