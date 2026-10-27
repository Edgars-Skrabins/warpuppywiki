import { describe, expect, it } from "vitest";
import { catalog, weaponIndex } from "../fixtures/testData";
import { emptyLoadout, setWeaponSetup, WeaponSetup } from "./loadout";
import {
  defaultSetup,
  selectMagazine,
  setupCost,
  setupStats,
  setupSummaryText,
  setupWeight,
  snapRounds,
  statRows,
  validateLoadout,
  validateSetup,
} from "./weaponSetup";

const SCOPE_PRICE = catalog.price("Id.Item.3xScope")?.price ?? 0;

function ak74(overrides: Partial<WeaponSetup> = {}): WeaponSetup {
  return { ...WeaponSetup.parse({ itemId: "Id.Item.AK74M" }), ...overrides };
}

const scopedAk = ak74({
  attachments: { Sight: "Id.Item.3xScope" },
  magazine: { id: "Id.Item.AK74MMagazine", ammoType: "ArmorPiercing", count: 4 },
});

function weapon(id: string) {
  const found = weaponIndex.weapon(id);
  if (found === undefined) {
    throw new Error(`No fixture weapon ${id}`);
  }
  return found;
}

describe("setupCost", () => {
  it("adds the attachments and pre-loaded magazines to the weapon price", () => {
    expect(setupCost(scopedAk, catalog)).toBe(SCOPE_PRICE + 4 * 155);
  });

  it("charges loose ammo by vendor lot", () => {
    expect(setupCost(ak74({ looseAmmo: { itemId: "Id.Item.545mm.HollowPoint", rounds: 25 } }), catalog)).toBe(3 * 25);
  });

  it("ignores magazines with a count of zero", () => {
    expect(setupCost(ak74({ magazine: { id: "Id.Item.AK74MMagazine", ammoType: "FMJ", count: 0 } }), catalog)).toBe(0);
  });
});

describe("setupWeight", () => {
  it("adds attachment and magazine weights and counts ammo as zero", () => {
    const setup = { ...scopedAk, looseAmmo: { itemId: "Id.Item.545mm", rounds: 30 } };
    expect(setupWeight(setup, catalog)).toBe(3 + 0.26 + 4 * 0.55);
  });
});

describe("snapRounds", () => {
  it("rounds up to whole lots within the limit", () => {
    expect(snapRounds(12, 5)).toBe(15);
    expect(snapRounds(-3, 10)).toBe(0);
    expect(snapRounds(999, 30)).toBe(480);
  });
});

describe("selectMagazine", () => {
  const options = weaponIndex.magazineOptions(weapon("Id.Item.AK74M"));
  const extended = options.find((option) => option.attachment.id === "Id.Item.AK74MExtendedMagazine");

  it("keeps the loaded ammo type and count when the new magazine sells it", () => {
    expect(
      extended && selectMagazine(extended, { id: "Id.Item.AK74MMagazine", ammoType: "HollowPoint", count: 6 }),
    ).toEqual({ id: "Id.Item.AK74MExtendedMagazine", ammoType: "HollowPoint", count: 6 });
  });

  it("falls back to the first sold variation", () => {
    expect(extended && selectMagazine(extended, { id: "Id.Item.AK74MMagazine", ammoType: "Slug", count: 2 })).toEqual({
      id: "Id.Item.AK74MExtendedMagazine",
      ammoType: "FMJ",
      count: 2,
    });
  });
});

describe("defaultSetup", () => {
  it("gives a magazine-fed weapon four FMJ magazines of the default type", () => {
    expect(defaultSetup("Id.Item.AK74M", weaponIndex, catalog).magazine).toEqual({
      id: "Id.Item.AK74MMagazine",
      ammoType: "FMJ",
      count: 4,
    });
  });

  it("gives a weapon without detachable magazines one lot of loose rounds", () => {
    expect(defaultSetup("Id.Item.Mosin", weaponIndex, catalog)).toMatchObject({
      magazine: null,
      looseAmmo: { itemId: "Id.Item.762x54mm", rounds: 5 },
    });
  });
});

describe("validateSetup", () => {
  it("keeps a setup that fits", () => {
    expect(validateSetup(scopedAk, weaponIndex)).toEqual({ setup: scopedAk, dropped: [] });
  });

  it("drops an attachment that no longer fits and a magazine with an unknown id", () => {
    const stale = ak74({
      attachments: { Underbarrel: "Id.Item.3xScope" },
      magazine: { id: "Id.Item.RemovedMagazine", ammoType: "FMJ", count: 4 },
    });
    expect(validateSetup(stale, weaponIndex)).toEqual({
      setup: ak74(),
      dropped: ["Spitfire 3X", "Id.Item.RemovedMagazine"],
    });
  });

  it("drops loose ammo of another caliber", () => {
    const stale = ak74({ looseAmmo: { itemId: "Id.Item.762x54mm", rounds: 10 } });
    expect(validateSetup(stale, weaponIndex).setup.looseAmmo).toBeNull();
  });
});

describe("validateLoadout", () => {
  it("cleans every weapon slot and names the slots that lost parts", () => {
    const stale = ak74({ attachments: { Underbarrel: "Id.Item.3xScope" } });
    const loadout = setWeaponSetup(setWeaponSetup(emptyLoadout(0), "primary", scopedAk), "sidearm", stale);
    expect(validateLoadout(loadout, weaponIndex)).toEqual({
      loadout: setWeaponSetup(loadout, "sidearm", ak74()),
      droppedSlots: ["sidearm"],
    });
  });

  it("returns the same loadout when nothing was dropped", () => {
    const loadout = setWeaponSetup(emptyLoadout(0), "primary", scopedAk);
    expect(validateLoadout(loadout, weaponIndex).loadout).toBe(loadout);
  });
});

describe("setupSummaryText", () => {
  it("lists attachments, magazines and loose rounds", () => {
    const setup = { ...scopedAk, looseAmmo: { itemId: "Id.Item.545mm.HollowPoint", rounds: 20 } };
    expect(setupSummaryText(setup, weaponIndex, catalog)).toBe("Spitfire 3X · 4 × 30 RND AP · 20 RND 5.45mm HP");
  });

  it("says when the weapon is bare", () => {
    expect(setupSummaryText(ak74(), weaponIndex, catalog)).toBe("Bare weapon");
  });
});

describe("statRows", () => {
  const value = (rows: ReturnType<typeof statRows>, key: string) => rows.find((row) => row.key === key);

  it("compares the fitted weapon with the bare weapon", () => {
    const rows = statRows(setupStats(weapon("Id.Item.AK74M"), scopedAk, weaponIndex, []));
    expect(value(rows, "zoom")).toMatchObject({ bare: 1, fitted: 3 });
    expect(value(rows, "adsTime")?.bare).toBeCloseTo(0.8);
    expect(value(rows, "adsTime")?.fitted).toBeCloseTo(0.88);
    expect(value(rows, "magazineCapacity")).toMatchObject({ bare: 30, fitted: 30 });
    expect(value(rows, "Character.WeaponSway.StabilizationTimeMultiplier")).toMatchObject({ bare: 1, fitted: 1.35 });
  });

  it("applies extra sources such as armor to both sides", () => {
    const heavy = [
      {
        label: "Armor",
        modifiers: [{ attribute: "Character.AdsTimeMultiplier", op: "multiply" as const, value: 1.5 }],
      },
    ];
    const rows = statRows(setupStats(weapon("Id.Item.AK74M"), ak74(), weaponIndex, heavy));
    expect(value(rows, "adsTime")?.bare).toBeCloseTo(1.2);
    expect(value(rows, "adsTime")?.fitted).toBeCloseTo(1.2);
  });

  it("leaves out character attributes that are not multipliers", () => {
    const weightClass = [
      { label: "Weight class", modifiers: [{ attribute: "Character.Weight", op: "add" as const, value: 2 }] },
    ];
    const rows = statRows(setupStats(weapon("Id.Item.AK74M"), ak74(), weaponIndex, weightClass));
    expect(value(rows, "Character.Weight")).toBeUndefined();
  });
});
