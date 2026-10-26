import { describe, expect, it } from "vitest";
import { AMMO_TYPE_LABELS, ammoTypeFromVariationSuffix, ammoTypeOf, type AmmoTypeKey } from "./ammoTypes";

describe("ammoTypeOf", () => {
  it.each<[string, AmmoTypeKey]>([
    ["Item.Ammo.Type.FMJ", "FMJ"],
    ["Item.Ammo.Type.FMJ.Tracer", "Tracer"],
    ["Item.Ammo.Type.HollowPoint", "HollowPoint"],
    ["Item.Ammo.Type.HollowPoint.Tracer", "HollowPoint.Tracer"],
    ["Item.Ammo.Type.ArmorPiercing", "ArmorPiercing"],
    ["Item.Ammo.Type.ArmorPiercing.Tracer", "ArmorPiercing.Tracer"],
    ["Item.Ammo.Type.Buckshot", "Buckshot"],
    ["Item.Ammo.Type.Slug", "Slug"],
  ])("maps %s to %s", (tag, type) => {
    expect(ammoTypeOf({ tags: ["Item.Ammo", "Item.Caliber.545mm", tag] })).toBe(type);
  });

  it("reads the tag case-insensitively", () => {
    expect(ammoTypeOf({ tags: ["item.ammo.type.armorpiercing.TRACER"] })).toBe("ArmorPiercing.Tracer");
  });

  it("defaults to FMJ without a type tag", () => {
    expect(ammoTypeOf({ tags: ["Item.Ammo", "Item.Ammo.Type"] })).toBe("FMJ");
  });
});

describe("ammoTypeFromVariationSuffix", () => {
  it.each<[string, AmmoTypeKey]>([
    ["FMJ", "FMJ"],
    ["FMJTracer", "Tracer"],
    ["HollowPoint", "HollowPoint"],
    ["HollowPointTracer", "HollowPoint.Tracer"],
    ["ArmorPiercing", "ArmorPiercing"],
    ["ArmorPiercingTracer", "ArmorPiercing.Tracer"],
  ])("maps %s to %s", (suffix, type) => {
    expect(ammoTypeFromVariationSuffix(suffix)).toBe(type);
  });

  it("returns null for a suffix that is not an ammo type", () => {
    expect(ammoTypeFromVariationSuffix("AK74MMagazine")).toBeNull();
  });
});

describe("AMMO_TYPE_LABELS", () => {
  it("uses the short labels", () => {
    expect(AMMO_TYPE_LABELS).toEqual({
      FMJ: "FMJ",
      Tracer: "FMJ (T)",
      HollowPoint: "HP",
      "HollowPoint.Tracer": "HP (T)",
      ArmorPiercing: "AP",
      "ArmorPiercing.Tracer": "AP (T)",
      Buckshot: "Buckshot",
      Slug: "Slug",
    });
  });
});
