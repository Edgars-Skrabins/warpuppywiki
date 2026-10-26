import { describe, expect, it } from "vitest";
import { buildCatalog } from "./catalog";
import { fixtureItem, itemsFile, rolesFile, tagsFile } from "./fixtures/gameData";

const catalog = buildCatalog({ items: itemsFile, tags: tagsFile, roles: rolesFile });

describe("buildCatalog", () => {
  it("finds items regardless of case", () => {
    expect(catalog.item("id.item.ak74m")?.id).toBe("Id.Item.AK74M");
    expect(catalog.item("Id.Item.Nothing")).toBeUndefined();
  });

  it("leaves developer items out of playerItems", () => {
    const developer = fixtureItem("Id.Item.ArtilleryBarrelTest");
    expect(catalog.playerItems).not.toContain(developer);
    expect(catalog.playerItems).toContain(fixtureItem("Id.Item.AK74M"));
    expect(catalog.isPlayerItem(developer)).toBe(false);
    expect(catalog.nonPlayerReason(developer)).toBe("developer");
  });

  it("gives the archetype with the game's label", () => {
    expect(catalog.archetype(fixtureItem("Id.Item.AK74M"))).toEqual({ id: "AR", label: "Assault Rifle" });
    expect(catalog.archetype(fixtureItem("Id.Item.545mm"))).toBeNull();
  });

  it("falls back to the subtitle, then the id part, for archetypes without tag text", () => {
    const ak = fixtureItem("Id.Item.AK74M");
    expect(catalog.archetype({ ...ak, tags: ["Item.Archetype.Mystery"], subtitle: "Rifle" })).toEqual({
      id: "Mystery",
      label: "Rifle",
    });
    expect(catalog.archetype({ ...ak, tags: ["Item.Archetype.Mystery"], subtitle: null })).toEqual({
      id: "Mystery",
      label: "Mystery",
    });
  });

  it("lists slots without vehicle slots", () => {
    const ak = fixtureItem("Id.Item.AK74M");
    expect(catalog.slots(ak)).toEqual(["Primary", "Secondary"]);
    expect(catalog.slots({ ...ak, tags: ["Inventory.Slot.Vehicle.Turret", "Inventory.Slot.Primary"] })).toEqual([
      "Primary",
    ]);
  });

  it("describes a role-level unlock with its label and XP", () => {
    expect(catalog.unlock(fixtureItem("Id.Item.M4"))).toEqual({
      role: "Infantry",
      roleLabel: "Assault",
      level: 28,
      cost: 150000,
      xpRequired: rolesFile.roles.find((role) => role.id === "Infantry")?.levels[28]?.xp,
    });
    expect(catalog.unlock(fixtureItem("Id.Item.M4"))?.xpRequired).toEqual(expect.any(Number));
  });

  it("has no XP for a Wardog unlock", () => {
    expect(catalog.unlock(fixtureItem("Id.Item.LightArmor"))).toEqual({
      role: "Wardog",
      roleLabel: "Wardog",
      level: 3,
      cost: 10000,
      xpRequired: null,
    });
    expect(catalog.unlock(fixtureItem("Id.Item.AK74M"))).toBeNull();
  });

  it("prices items and lists their vendor variations", () => {
    expect(catalog.price("Id.Item.545mm.ArmorPiercing")).toMatchObject({ price: 40, soldWith: "Id.Item.545mm" });
    expect(catalog.price("Id.Item.AK74M")).toBeNull();
    const variations = catalog.variations(fixtureItem("Id.Item.AK74MMagazine"));
    expect(variations).toHaveLength(7);
    expect(variations.find((variation) => variation.tag === "Id.Item.AK74MMagazine.ArmorPiercing")?.price.price).toBe(
      155,
    );
  });

  it("gives tag texts", () => {
    expect(catalog.tagText("item.archetype.ar")).toBe("Assault Rifle");
    expect(catalog.tagText("Item.Caliber.545mm")).toBeNull();
    expect(catalog.roleLabel("Infantry")).toBe("Assault");
  });
});
