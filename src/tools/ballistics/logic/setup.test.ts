import { describe, expect, it } from "vitest";
import type { PlayerWeapon } from "@/core/weapons";
import { emptyWeaponIndex, fixtureWeapon, fixtureWeaponIndex } from "../fixtures/weaponIndex";
import { ballisticAmmoOptions, ballisticWeapons, computeSetup, defaultMaxDistance, resolveSetup } from "./setup";

const index = fixtureWeaponIndex();
const ak74 = fixtureWeapon(index, "Id.Item.AK74M");

function withArchetype(weapon: PlayerWeapon, id: string): PlayerWeapon {
  return { ...weapon, archetype: { id, label: id } };
}

describe("ballisticWeapons", () => {
  it("lists the weapons with a muzzle velocity and flat-fire ammo, sorted by name", () => {
    expect(ballisticWeapons(index).map((weapon) => weapon.name)).toEqual([
      "AK74",
      "M4",
      "M500",
      "Mosin Nagant",
      "SV98",
    ]);
  });

  it("leaves out the MP5, which has no 9 mm ammo in the data", () => {
    const mp5 = fixtureWeapon(index, "Id.Item.WEPN_028");
    expect(ballisticAmmoOptions(index, mp5)).toEqual([]);
    expect(ballisticWeapons(index).map((weapon) => weapon.id)).not.toContain("Id.Item.WEPN_028");
  });

  it("leaves out a weapon without a muzzle velocity", () => {
    const stalled = { ...ak74, stats: { ...ak74.stats, muzzleVelocity: null } };
    const ids = ballisticWeapons({ ...index, playerWeapons: [stalled] }).map((weapon) => weapon.id);
    expect(ids).toEqual([]);
  });
});

describe("ballisticAmmoOptions", () => {
  it("offers the AK74 its six 5.45 mm rounds", () => {
    const options = ballisticAmmoOptions(index, ak74);
    expect(options.map((option) => option.item.id)).toEqual([
      "Id.Item.545mm",
      "Id.Item.545mm.ArmorPiercing",
      "Id.Item.545mm.ArmorPiercing.Tracer",
      "Id.Item.545mm.HollowPoint",
      "Id.Item.545mm.HollowPoint.Tracer",
      "Id.Item.545mm.Tracer",
    ]);
    expect(options.every((option) => option.projectile?.id === "Item.Caliber.545mm")).toBe(true);
  });

  it("offers the M500 its 12g shell, which fires the 7 mm buckshot projectile", () => {
    const options = ballisticAmmoOptions(index, fixtureWeapon(index, "Id.Item.M500"));
    expect(options.map((option) => [option.item.id, option.projectile?.id])).toEqual([
      ["Id.Item.12g", "Item.Caliber.7mmBuck"],
    ]);
  });
});

describe("defaultMaxDistance", () => {
  it("gives sniper rifles 1000 m", () => {
    expect(defaultMaxDistance(fixtureWeapon(index, "Id.Item.SV98"))).toBe(1000);
    expect(defaultMaxDistance(fixtureWeapon(index, "Id.Item.Mosin"))).toBe(1000);
  });

  it("matches the DMR and Sniper archetypes case-insensitively", () => {
    expect(defaultMaxDistance(withArchetype(ak74, "dmr"))).toBe(1000);
    expect(defaultMaxDistance(withArchetype(ak74, "SNIPER"))).toBe(1000);
  });

  it("gives other weapons and no weapon 600 m", () => {
    expect(defaultMaxDistance(ak74)).toBe(600);
    expect(defaultMaxDistance(fixtureWeapon(index, "Id.Item.M500"))).toBe(600);
    expect(defaultMaxDistance(fixtureWeapon(index, "Id.Item.WEPN_028"))).toBe(600);
    expect(defaultMaxDistance({ ...ak74, archetype: null })).toBe(600);
    expect(defaultMaxDistance(null)).toBe(600);
  });
});

describe("resolveSetup", () => {
  it("falls back to the first weapon and its first ammo for an empty selection", () => {
    const setup = resolveSetup(index, { weapon: null, ammo: null });
    expect(setup?.weapon.id).toBe("Id.Item.AK74M");
    expect(setup?.ammo.item.id).toBe("Id.Item.545mm");
    expect(setup?.ammoOptions).toHaveLength(6);
  });

  it("matches stored weapon and ammo ids case-insensitively", () => {
    const setup = resolveSetup(index, { weapon: "id.item.sv98", ammo: "ID.ITEM.762X54MM" });
    expect(setup?.weapon.id).toBe("Id.Item.SV98");
    expect(setup?.ammo.item.id).toBe("Id.Item.762x54mm");
  });

  it("falls back field by field when the weapon or the ammo is unknown", () => {
    const unknownWeapon = resolveSetup(index, { weapon: "Id.Item.Gone", ammo: "Id.Item.545mm.Tracer" });
    expect(unknownWeapon?.weapon.id).toBe("Id.Item.AK74M");
    expect(unknownWeapon?.ammo.item.id).toBe("Id.Item.545mm.Tracer");

    const foreignAmmo = resolveSetup(index, { weapon: "Id.Item.M4", ammo: "Id.Item.545mm" });
    expect(foreignAmmo?.weapon.id).toBe("Id.Item.M4");
    expect(foreignAmmo?.ammo.item.id).toBe("Id.Item.556mm");
  });

  it("returns null when no weapon qualifies", () => {
    expect(resolveSetup(emptyWeaponIndex(), { weapon: null, ammo: null })).toBeNull();
  });
});

describe("computeSetup", () => {
  const setup = resolveSetup(index, { weapon: "Id.Item.AK74M", ammo: "Id.Item.545mm" });
  if (setup === null) {
    throw new Error("No AK74 setup");
  }

  it("simulates along the bore to the max distance and builds the range card", () => {
    const result = computeSetup(setup, 600, null);
    expect(result.setup).toBe(setup);
    expect(result.projectile).toMatchObject({ massKg: 0.0034, diameterMm: 5.6, formFactor: 1.4 });
    expect(result.samples).toHaveLength(601);
    expect(result.samples[0]).toEqual({ distance: 0, height: 0, time: 0, velocity: 880 });
    expect(result.rows.map((row) => row.distance)).toEqual([
      25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 350, 400, 450, 500, 550, 600,
    ]);
    expect(result.rows.every((row) => row.dropCm < 0 && row.lead === null)).toBe(true);
    expect(result.rows.find((row) => row.distance === 500)?.damage).toBe(26);
  });

  it("passes the target speed to the range card's lead", () => {
    const rows = computeSetup(setup, 300, 5).rows;
    expect(rows.every((row) => row.lead !== null && row.lead > 0)).toBe(true);
  });

  it("returns the empty result for ammo without a usable projectile", () => {
    const empty = { projectile: null, samples: [], rows: [] };
    const noProjectile = { ...setup, ammo: { ...setup.ammo, projectile: null } };
    expect(computeSetup(noProjectile, 600, null)).toEqual({ setup: noProjectile, ...empty });

    const source = setup.ammo.projectile;
    if (source === null) {
      throw new Error("No 5.45 mm projectile");
    }
    const noDrag = { ...setup, ammo: { ...setup.ammo, projectile: { ...source, drag: null } } };
    expect(computeSetup(noDrag, 600, null)).toEqual({ setup: noDrag, ...empty });
  });

  it("returns the empty result for a weapon without a muzzle velocity", () => {
    const stalled = { ...setup, weapon: { ...setup.weapon, stats: { ...setup.weapon.stats, muzzleVelocity: null } } };
    expect(computeSetup(stalled, 600, null)).toMatchObject({ projectile: null, samples: [], rows: [] });
  });
});
