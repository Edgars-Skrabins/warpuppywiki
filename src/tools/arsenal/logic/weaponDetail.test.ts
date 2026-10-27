import { describe, expect, it } from "vitest";
import { testData, testWeapon } from "../fixtures/testData";
import { ARMOR_TARGETS, descriptionBullets, weaponDetail } from "./weaponDetail";

const ak = weaponDetail(testData, testWeapon("Id.Item.AK74M"));

describe("weaponDetail", () => {
  it("lists six AK74 ammo types with STK against three armors", () => {
    expect(ak.ammo.map((row) => row.ammoType)).toEqual(
      expect.arrayContaining([
        "FMJ",
        "Tracer",
        "HollowPoint",
        "HollowPoint.Tracer",
        "ArmorPiercing",
        "ArmorPiercing.Tracer",
      ]),
    );
    expect(ak.ammo).toHaveLength(6);
    const fmj = ak.ammo.find((row) => row.ammoType === "FMJ");
    expect(fmj?.stk).toHaveLength(ARMOR_TARGETS.length);
    expect(fmj?.stk[0]).toBe(5);
    for (const row of ak.ammo) {
      expect(row.stk.every((stk) => stk !== null && stk >= 1)).toBe(true);
    }
    expect(fmj?.stk[2]).toBeGreaterThan(fmj?.stk[0] ?? Infinity);
  });

  it("groups attachments by visible slot", () => {
    expect(ak.attachmentSlots.map((slot) => slot.slot)).toEqual(["Sight", "Magazine", "Underbarrel"]);
    const magazines = ak.attachmentSlots.find((slot) => slot.slot === "Magazine")?.attachments ?? [];
    expect(magazines.map((entry) => entry.name)).toContain("AK74 60 RND Magazine");
    expect(magazines[0]).toMatchObject({ id: "Id.Item.AK74MMagazine", isDefault: true });
  });

  it("lists hidden built-in parts separately", () => {
    const visible = new Set(ak.attachmentSlots.map((slot) => slot.slot));
    expect(ak.builtIns.every((part) => !visible.has(part.slot))).toBe(true);
  });

  it("reads magazines, header and hit multipliers", () => {
    expect(ak.magazines.map((row) => row.capacity)).toEqual(expect.arrayContaining([30, 60, 75]));
    expect(ak.bullets).toEqual(["Semi / Full Auto", "5.45x39mm"]);
    expect(ak.hitClass).toBe("Weapon.AR");
    expect(ak.hitMultipliers).toHaveLength(12);
  });
});

describe("descriptionBullets", () => {
  it("splits lines and strips bullet marks", () => {
    expect(descriptionBullets("- One\n\n• Two ")).toEqual(["One", "Two"]);
    expect(descriptionBullets(null)).toEqual([]);
  });
});
