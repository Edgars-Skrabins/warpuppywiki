import { describe, expect, it } from "vitest";
import { AMMO_TYPE_LABELS, ammoTypeFromVariationSuffix, ammoTypeOf, type AmmoTypeKey } from "./ammoTypes";
import { fixtureItem } from "./fixtures/gameData";

describe("ammoTypeOf", () => {
  it.each<[string, AmmoTypeKey]>([
    ["Id.Item.556mm", "FMJ"],
    ["Id.Item.556mm.Tracer", "Tracer"],
    ["Id.Item.556mm.HollowPoint", "HollowPoint"],
    ["Id.Item.556mm.HollowPoint.Tracer", "HollowPoint.Tracer"],
    ["Id.Item.556mm.ArmorPiercing", "ArmorPiercing"],
    ["Id.Item.556mm.ArmorPiercing.Tracer", "ArmorPiercing.Tracer"],
  ])("reads %s as %s from the id suffix", (id, type) => {
    expect(ammoTypeOf(fixtureItem(id))).toBe(type);
  });

  it("prefers the id over a contradicting type tag", () => {
    expect(fixtureItem("Id.Item.556mm").tags).toContain("Item.Ammo.Type.FMJ.Tracer");
    expect(ammoTypeOf(fixtureItem("Id.Item.556mm"))).toBe("FMJ");
  });

  it("reads the id suffix case-insensitively", () => {
    expect(ammoTypeOf({ id: "ID.ITEM.556MM.HOLLOWPOINT", tags: ["item.caliber.556mm"] })).toBe("HollowPoint");
  });

  it("falls back to the tag when the id has no recognizable form", () => {
    expect(ammoTypeOf({ id: "Id.Item.12g.7mmBuck", tags: ["Item.Caliber.12g", "Item.Ammo.Type.Buckshot"] })).toBe(
      "Buckshot",
    );
    expect(ammoTypeOf({ id: "Id.Item.Shell", tags: ["Item.Caliber.12g", "Item.Ammo.Type.Slug"] })).toBe("Slug");
  });

  it.each<[string, AmmoTypeKey]>([
    ["Item.Ammo.Type.FMJ", "FMJ"],
    ["Item.Ammo.Type.FMJ.Tracer", "Tracer"],
    ["Item.Ammo.Type.HollowPoint", "HollowPoint"],
    ["Item.Ammo.Type.HollowPoint.Tracer", "HollowPoint.Tracer"],
    ["Item.Ammo.Type.ArmorPiercing", "ArmorPiercing"],
    ["Item.Ammo.Type.ArmorPiercing.Tracer", "ArmorPiercing.Tracer"],
    ["Item.Ammo.Type.Buckshot", "Buckshot"],
    ["Item.Ammo.Type.Slug", "Slug"],
  ])("maps the tag %s to %s", (tag, type) => {
    expect(ammoTypeOf({ id: "Id.Item.Round", tags: ["Item.Ammo", "Item.Caliber.545mm", tag] })).toBe(type);
  });

  it("reads the tag case-insensitively", () => {
    expect(ammoTypeOf({ id: "Id.Item.Round", tags: ["item.ammo.type.armorpiercing.TRACER"] })).toBe(
      "ArmorPiercing.Tracer",
    );
  });

  it("defaults to FMJ without a recognizable id or type tag", () => {
    expect(ammoTypeOf({ id: "Id.Item.Round", tags: ["Item.Ammo", "Item.Ammo.Type"] })).toBe("FMJ");
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
