import { describe, expect, it } from "vitest";
import { AMMO_TYPE_LABELS } from "./ammoTypes";
import { ammoFile, attachmentsFile, fixtureCatalog, weaponsFile } from "./fixtures/gameData";
import { buildWeaponIndex, type PlayerWeapon } from "./weaponIndex";

const index = buildWeaponIndex({
  weapons: weaponsFile,
  ammo: ammoFile,
  attachments: attachmentsFile,
  catalog: fixtureCatalog,
});

function weapon(id: string): PlayerWeapon {
  const found = index.weapon(id);
  if (found === undefined) {
    throw new Error(`No player weapon ${id}`);
  }
  return found;
}

const ak74 = weapon("id.item.ak74m");

describe("buildWeaponIndex", () => {
  it("lists player weapons and leaves out developer items", () => {
    const ids = index.playerWeapons.map((entry) => entry.id);
    expect(ids).toContain("Id.Item.AK74M");
    expect(ids).not.toContain("Id.Item.ArtilleryBarrelTest");
  });

  it("describes the AK74 as an assault rifle that is not sold or unlocked", () => {
    expect(ak74.damageClass).toBe("Weapon.AR");
    expect(ak74.archetype?.id).toBe("AR");
    expect(ak74.inventorySlots).toEqual(["Primary", "Secondary"]);
    expect(ak74.price).toBeNull();
    expect(ak74.unlock).toBeNull();
    expect(ak74.visibleSlots.map((slot) => slot.slot)).toEqual(["Sight", "Magazine", "Underbarrel"]);
  });

  it("prices the M4 and gates it behind an Infantry unlock", () => {
    const m4 = weapon("Id.Item.M4");
    expect(m4.price?.price).toBe(2800);
    expect(m4.unlock).toMatchObject({ role: "Infantry", roleLabel: "Assault", level: 28 });
  });

  it("offers the 3x scope in the AK74 sight slot", () => {
    expect(index.slotOptions(ak74, "Sight").map((attachment) => attachment.id)).toContain("Id.Item.3xScope");
  });

  it("lists the slot's default first", () => {
    expect(index.slotOptions(ak74, "magazine")[0]?.id).toBe("Id.Item.AK74MMagazine");
  });

  it("returns no options for a slot the weapon does not have", () => {
    expect(index.slotOptions(ak74, "Muzzle")).toEqual([]);
  });

  it("offers the six 5.45 mm rounds for the AK74 with their projectile, type and price", () => {
    const options = index.ammoOptions(ak74);
    expect(options).toHaveLength(6);
    expect(options.every((option) => option.projectile?.id === "Item.Caliber.545mm")).toBe(true);
    const byLabel = Object.fromEntries(
      options.map((option) => [AMMO_TYPE_LABELS[option.ammoType], option.price?.price]),
    );
    expect(byLabel).toEqual({ FMJ: 15, "FMJ (T)": 15, HP: 25, "HP (T)": 25, AP: 40, "AP (T)": 40 });
    expect(options.every((option) => option.price?.soldWith === "Id.Item.545mm")).toBe(true);
  });

  it("offers the M4 its six 5.56 mm rounds although its chamber blocks its own caliber", () => {
    const options = index.ammoOptions(weapon("Id.Item.M4"));
    expect(options.map((option) => option.item.id)).toHaveLength(6);
    expect(options.every((option) => option.projectile?.id === "Item.Caliber.556mm")).toBe(true);
    expect(options.map((option) => option.ammoType).sort()).toEqual([
      "ArmorPiercing",
      "ArmorPiercing.Tracer",
      "FMJ",
      "HollowPoint",
      "HollowPoint.Tracer",
      "Tracer",
    ]);
  });

  it("narrows caliber options by the chamber rules when that leaves some", () => {
    const chamber = {
      slot: "Chamber",
      items: ["Id.Item.556mm"],
      contexts: [],
      filter: "AllowList",
      blockedItems: [],
      blockedContexts: [],
      hidden: true,
    };
    const m4 = weapon("Id.Item.M4");
    const narrowed = index.ammoOptions({ ...m4, stats: { ...m4.stats, slots: [chamber] } });
    expect(narrowed.map((option) => option.item.id)).toEqual(["Id.Item.556mm"]);
  });

  it("returns no ammo for a weapon whose calibers and chamber match nothing", () => {
    expect(index.ammoOptions({ ...ak74, stats: { ...ak74.stats, calibers: ["9mm"], slots: [] } })).toEqual([]);
  });

  it("keeps 5.56 mm out of the AK74 chamber", () => {
    expect(index.ammoOptions(ak74).some((option) => option.item.id.includes("556"))).toBe(false);
  });

  it("offers the AK74 magazines with capacity and pre-loaded prices", () => {
    const magazines = index.magazineOptions(ak74);
    const standard = magazines.find((option) => option.capacity === 30);
    const extended = magazines.find((option) => option.capacity === 60);
    expect(standard?.item.id).toBe("Id.Item.AK74MMagazine");
    expect(standard?.empty?.price).toBe(35);
    expect(standard?.loaded.find((entry) => entry.ammoType === "ArmorPiercing")?.price.price).toBe(155);
    expect(extended?.loaded.find((entry) => entry.ammoType === "ArmorPiercing")?.price.price).toBe(390);
    expect(standard?.loaded.map((entry) => entry.ammoType)).toEqual([
      "ArmorPiercing",
      "ArmorPiercing.Tracer",
      "FMJ",
      "Tracer",
      "HollowPoint",
      "HollowPoint.Tracer",
    ]);
    expect(standard?.calibers).toEqual(["545mm"]);
  });

  it("finds attachments by id regardless of case", () => {
    expect(index.attachment("ID.ITEM.3XSCOPE")?.id).toBe("Id.Item.3xScope");
  });
});

describe("hiddenDefaults", () => {
  function withSlots(slots: PlayerWeapon["stats"]["slots"]): PlayerWeapon {
    return { ...ak74, stats: { ...ak74.stats, slots } };
  }

  const base = { items: [], contexts: [], filter: "AllowList", blockedItems: [], blockedContexts: [] };

  it("returns only hidden slots whose default resolves to an attachment", () => {
    const fitted = index.hiddenDefaults(
      withSlots([
        { ...base, slot: "Magazine", hidden: true, default: "id.item.ak74mmagazine" },
        { ...base, slot: "Sight", hidden: false, default: "Id.Item.3xScope" },
        { ...base, slot: "Barrel", hidden: true, default: "Id.Item.Missing" },
        { ...base, slot: "Stock", hidden: true },
      ]),
    );
    expect(fitted).toEqual([
      { slot: "Magazine", attachment: index.attachment("Id.Item.AK74MMagazine"), hiddenDefault: true },
    ]);
  });

  it("is empty for the AK74, whose hidden slots declare no default", () => {
    expect(index.hiddenDefaults(ak74)).toEqual([]);
  });
});
