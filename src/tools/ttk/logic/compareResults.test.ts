import { describe, expect, it } from "vitest";
import { sameId } from "@/core/catalog";
import type { WeaponIndex } from "@/core/weapons";
import { fixtureSources } from "../fixtures/sources";
import { DEFAULT_MATCHUP, DEFAULT_SHARED, type CompareState, type Setup } from "../state";
import type { MatchupSources } from "./buildScenario";
import { addSetup, compareResults, duplicateSetup, removeSetup, seedComparison } from "./compareResults";

const ak = (ammoType: string): Setup => ({ weaponId: "Id.Item.AK74M", ammoType, magazineId: null });

function comparison(...setups: Setup[]): CompareState {
  return { shared: DEFAULT_SHARED, setups };
}

const index = fixtureSources.index;

const explosiveM4: MatchupSources = {
  ...fixtureSources,
  index: {
    ...index,
    ammoOptions: (weapon) =>
      index
        .ammoOptions(weapon)
        .map((option) =>
          sameId(weapon.id, "Id.Item.M4") && option.projectile !== null
            ? { ...option, projectile: { ...option.projectile, explosive: {} } }
            : option,
        ),
  } satisfies WeaponIndex,
};

describe("compareResults", () => {
  it("marks hollow point best against no armor", () => {
    const [fmj, hp] = compareResults(comparison(ak("FMJ"), ak("HollowPoint")), fixtureSources);
    expect(hp?.bestStk).toBe(true);
    expect(fmj?.bestStk).toBe(false);
    expect(hp?.stk).toBeLessThan(fmj?.stk ?? 0);
    expect(hp?.bestTtk).toBe(true);
  });

  it("marks every tied row best", () => {
    const rows = compareResults(comparison(ak("FMJ"), ak("FMJ")), fixtureSources);
    expect(rows.map((row) => [row.bestStk, row.bestTtk])).toEqual([
      [true, true],
      [true, true],
    ]);
  });

  it("leaves unsupported rows out of best and shows their reason", () => {
    const rows = compareResults(
      comparison({ weaponId: "Id.Item.M4", ammoType: "FMJ", magazineId: null }, ak("FMJ")),
      explosiveM4,
    );
    expect(rows[0]).toMatchObject({ status: "explosive", stk: null, ttk: null, bestStk: false, bestTtk: false });
    expect(rows[1]).toMatchObject({ status: "ok", bestStk: true, bestTtk: true });
  });

  it("falls back to the weapon's first ammo when the stored type is not offered", () => {
    const [row] = compareResults(comparison(ak("Buckshot")), fixtureSources);
    expect(row?.status).toBe("ok");
    expect(row?.result.ok && row.result.scenario.ammo).toBe(row?.result.matchup?.ammoOptions[0]);
  });

  it("works out first-shot DPS from the fire rate", () => {
    const [row] = compareResults(comparison(ak("FMJ")), fixtureSources);
    const rpm = row?.result.matchup?.weapon.stats.rpm ?? 0;
    expect(row?.dps).toBeCloseTo(((row?.firstShotDamage ?? 0) * rpm) / 60);
  });

  it("reports a weapon missing from the game data", () => {
    const [row] = compareResults(comparison({ ...ak("FMJ"), weaponId: "Id.Item.Nope" }), fixtureSources);
    expect(row).toMatchObject({ status: "unknown-weapon", label: "Unknown weapon", bestStk: false });
  });
});

describe("seedComparison", () => {
  it("starts with the single matchup and the same weapon with the next ammo type", () => {
    const seeded = seedComparison({ ...DEFAULT_MATCHUP, distance: 120 }, fixtureSources);
    expect(seeded.shared.distance).toBe(120);
    const [first, second] = seeded.setups;
    expect(first).toEqual({ weaponId: "Id.Item.AK74M", ammoType: "FMJ", magazineId: "Id.Item.AK74MMagazine" });
    expect(second?.weaponId).toBe("Id.Item.AK74M");
    expect(second?.ammoType).not.toBe("FMJ");
  });
});

describe("setup list edits", () => {
  const four = comparison(ak("FMJ"), ak("HollowPoint"), ak("ArmorPiercing"), ak("FMJ"));

  it("adds a copy of the last setup up to four", () => {
    expect(addSetup(comparison(ak("FMJ"), ak("HollowPoint"))).setups.at(-1)).toEqual(ak("HollowPoint"));
    expect(addSetup(four)).toBe(four);
  });

  it("duplicates a setup after itself", () => {
    expect(duplicateSetup(comparison(ak("FMJ"), ak("HollowPoint")), 0).setups).toEqual([
      ak("FMJ"),
      ak("FMJ"),
      ak("HollowPoint"),
    ]);
    expect(duplicateSetup(four, 0)).toBe(four);
  });

  it("never removes the last setup", () => {
    const one = comparison(ak("FMJ"));
    expect(removeSetup(one, 0)).toBe(one);
    expect(removeSetup(comparison(ak("FMJ"), ak("HollowPoint")), 0).setups).toEqual([ak("HollowPoint")]);
  });
});
