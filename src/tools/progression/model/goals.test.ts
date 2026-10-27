import { describe, expect, it } from "vitest";
import { buildCatalog } from "@/core/catalog";
import { AmmoFile } from "@/core/data/schemas/ammo";
import { AttachmentsFile } from "@/core/data/schemas/attachments";
import { ItemsFile } from "@/core/data/schemas/items";
import { RolesFile } from "@/core/data/schemas/roles";
import { TagsFile } from "@/core/data/schemas/tags";
import { WeaponsFile } from "@/core/data/schemas/weapons";
import { buildWeaponIndex } from "@/core/weapons";
import ammoJson from "@/test/fixtures/data/25937608/ammo.json";
import attachmentsJson from "@/test/fixtures/data/25937608/attachments.json";
import itemsJson from "@/test/fixtures/data/25937608/items.json";
import rolesJson from "@/test/fixtures/data/25937608/roles.json";
import tagsJson from "@/test/fixtures/data/25937608/tags.json";
import weaponsJson from "@/test/fixtures/data/25937608/weapons.json";
import { gatedItems, goalsForRoleUpTo, goalsForWeapon, ladderFor } from "./goals";

const itemsFile = ItemsFile.parse(itemsJson);
const m4 = itemsFile.items.find((item) => item.id === "Id.Item.M4");
if (m4 === undefined) {
  throw new Error("No M4 in fixtures");
}
const developerRifle = { ...m4, id: "Id.Item.M4.Developer", developer: true };
const catalog = buildCatalog({
  items: { ...itemsFile, items: [...itemsFile.items, developerRifle] },
  tags: TagsFile.parse(tagsJson),
  roles: RolesFile.parse(rolesJson),
});
const gated = gatedItems(catalog);

describe("gatedItems", () => {
  it("lists player items that have an unlock, with level, cost and shop price", () => {
    const entry = gated.find((candidate) => candidate.item.id === "Id.Item.M4");
    expect(entry?.unlock).toMatchObject({ role: "Infantry", roleLabel: "Assault", level: 28, cost: 150000 });
    expect(entry?.price?.price).toBe(2800);
    expect(gated.every((candidate) => candidate.item.unlock !== null)).toBe(true);
  });

  it("leaves out non-player items", () => {
    expect(gated.map((entry) => entry.item.id)).not.toContain("Id.Item.M4.Developer");
  });
});

describe("goalsForRoleUpTo", () => {
  it("selects every item of the role up to and including the level", () => {
    expect(goalsForRoleUpTo(gated, "recon", 17)).toEqual(["Id.Item.Mosin"]);
    expect(goalsForRoleUpTo(gated, "Recon", 18)).toEqual(["Id.Item.Mosin", "Id.Item.SV98"]);
    expect(goalsForRoleUpTo(gated, "Recon", 9)).toEqual([]);
  });

  it("orders the role ladder by level", () => {
    expect(ladderFor(gated, "Infantry").map((entry) => [entry.item.id, entry.unlock.level])).toEqual([
      ["Id.Item.AK74MExtendedMagazine", 25],
      ["Id.Item.M4", 28],
      ["Id.Item.AK74MMagazine75rnd", 36],
    ]);
  });
});

describe("goalsForWeapon", () => {
  const index = buildWeaponIndex({
    weapons: WeaponsFile.parse(weaponsJson),
    ammo: AmmoFile.parse(ammoJson),
    attachments: AttachmentsFile.parse(attachmentsJson),
    catalog,
  });

  it("includes the weapon's gated attachments, magazines and ammo, once each", () => {
    const ak74 = index.weapon("Id.Item.AK74M");
    if (ak74 === undefined) {
      throw new Error("No AK74M in the weapon index");
    }
    const ids = goalsForWeapon(ak74, index, gated);
    expect(ids).toEqual(
      expect.arrayContaining([
        "Id.Item.3xScope",
        "Id.Item.AK74MExtendedMagazine",
        "Id.Item.AK74MMagazine75rnd",
        "Id.Item.545mm.HollowPoint.Tracer",
        "Id.Item.545mm.ArmorPiercing.Tracer",
      ]),
    );
    expect(ids).not.toContain("Id.Item.AK74M");
    expect(ids).not.toContain("Id.Item.556mm.HollowPoint.Tracer");
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("includes the weapon itself when it is gated", () => {
    const weapon = index.weapon("Id.Item.M4");
    if (weapon === undefined) {
      throw new Error("No M4 in the weapon index");
    }
    expect(goalsForWeapon(weapon, index, gated)[0]).toBe("Id.Item.M4");
  });
});
