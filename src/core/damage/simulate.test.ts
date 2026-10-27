import { describe, expect, it } from "vitest";
import { hitPattern } from "./hitLocations";
import { simulateKill, stkByDistance } from "./simulate";
import { ak74Scenario, newPiece, rounded, testAmmo, testTarget, testWeapon, weaponAmmo } from "./testData";

function supported(result: ReturnType<typeof simulateKill>) {
  if (!result.supported) {
    throw new Error(`Unsupported: ${result.reason}`);
  }
  return result;
}

describe("simulateKill", () => {
  it("kills an unarmored target with five upper chest hits in 4 × 60 / 650 s", () => {
    const result = supported(simulateKill(ak74Scenario()));
    expect(result.killed).toBe(true);
    expect(result.stk).toBe(5);
    expect(result.ttk).toBeCloseTo((4 * 60) / 650, 10);
    expect(result.needsReload).toBe(false);
    expect(result.shots.map((shot) => rounded(shot.healthAfter))).toEqual([76.99, 53.98, 30.97, 7.96, 0]);
  });

  it("needs more shots through Level 3 armor and wears it shot by shot", () => {
    const result = supported(
      simulateKill(ak74Scenario({ target: testTarget({ body: newPiece("Id.Item.HeavyArmor") }) })),
    );
    expect(result.stk).toBe(9);
    const durability = result.shots.map((shot) => shot.bodyDurabilityAfter ?? 0);
    expect(durability[0]).toBeCloseTo(250 - 23.01 * 0.4, 10);
    durability.slice(1).forEach((value, index) => expect(value).toBeLessThan(durability[index] ?? 0));
    expect(result.shots.every((shot) => shot.helmetDurabilityAfter === null)).toBe(true);
  });

  it("cycles the mixed pattern", () => {
    const result = supported(
      simulateKill(ak74Scenario({ pattern: hitPattern("mixed").locations, target: testTarget({ health: 200 }) })),
    );
    expect(result.shots.slice(0, 5).map((shot) => shot.location)).toEqual([
      "Torso.Upper",
      "Torso.Upper",
      "Torso.Middle",
      "Head",
      "Torso.Upper",
    ]);
  });

  it("stops at the shot cap without a kill", () => {
    const result = supported(simulateKill(ak74Scenario({ target: testTarget({ health: 1_000_000 }) })));
    expect(result).toMatchObject({ killed: false, stk: null, ttk: null, needsReload: false });
    expect(result.shots).toHaveLength(200);
  });

  it("flags a reload and drops the time when the kill needs more rounds than the magazine holds", () => {
    const result = supported(simulateKill(ak74Scenario({ magazineCapacity: 3 })));
    expect(result).toMatchObject({ stk: 5, needsReload: true, ttk: null });
  });

  it("does not model explosive projectiles", () => {
    expect(simulateKill(ak74Scenario({ ammo: testAmmo("Id.Item.93mm") }))).toEqual({
      supported: false,
      reason: "explosive",
    });
  });

  it("reports ammo without a projectile", () => {
    expect(simulateKill(ak74Scenario({ ammo: testAmmo("Id.Item.AK74M") }))).toEqual({
      supported: false,
      reason: "no-projectile",
    });
  });

  it("fires the set number of pellets per shotgun shot", () => {
    const m500 = testWeapon("Id.Item.M500");
    const scenario = ak74Scenario({
      weapon: m500,
      ammo: weaponAmmo(m500, "Id.Item.12g"),
      distance: 10,
      pelletsPerShot: 6,
      target: testTarget({ health: 1000 }),
    });
    const result = supported(simulateKill(scenario));
    const firstShot = result.shots[0];
    expect(firstShot?.hits).toHaveLength(6);
    const perPellet = firstShot?.hits[0]?.healthDamage ?? 0;
    expect(firstShot?.healthAfter).toBeCloseTo(1000 - 6 * perPellet, 10);
    expect(supported(simulateKill({ ...scenario, pelletsPerShot: 1 })).shots[0]?.hits).toHaveLength(1);
  });
});

describe("stkByDistance", () => {
  it("never needs fewer shots further away", () => {
    const distances = Array.from({ length: 25 }, (_, index) => index * 50);
    const stks = stkByDistance(ak74Scenario(), distances).map((point) => point.stk ?? Infinity);
    stks.slice(1).forEach((stk, index) => expect(stk).toBeGreaterThanOrEqual(stks[index] ?? 0));
    expect(stks[0]).toBe(5);
    expect(stks.at(-1)).toBeGreaterThan(5);
  });
});
