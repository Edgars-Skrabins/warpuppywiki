import { beforeAll, describe, expect, it } from "vitest";
import { ItemsFile } from "@/core/data/schemas/items";
import { RolesFile } from "@/core/data/schemas/roles";
import { TagsFile } from "@/core/data/schemas/tags";
import { WeaponsFile } from "@/core/data/schemas/weapons";
import { buildCatalog, type Catalog } from "./catalog";
import { hasTag } from "./tags";

const files: Record<string, unknown> = import.meta.glob(
  [
    "/public/data/builds.json",
    "/public/data/*/items.json",
    "/public/data/*/tags.json",
    "/public/data/*/roles.json",
    "/public/data/*/weapons.json",
  ],
  { eager: true, import: "default" },
);

const builds = files["/public/data/builds.json"] as { latest: string } | undefined;

function dataFile(file: string): unknown {
  return files[`/public/data/${builds?.latest ?? ""}/${file}`];
}

describe.skipIf(!builds)("catalog against real data", () => {
  let catalog: Catalog;

  beforeAll(() => {
    catalog = buildCatalog({
      items: ItemsFile.parse(dataFile("items.json")),
      tags: TagsFile.parse(dataFile("tags.json")),
      roles: RolesFile.parse(dataFile("roles.json")),
    });
  });

  it("loads every item", () => {
    expect(catalog.items).toHaveLength(599);
  });

  it("keeps vehicle parts out of player items", () => {
    expect(catalog.playerItems.filter((item) => hasTag(item.tags, "Inventory.Slot.Vehicle"))).toEqual([]);
  });

  it("treats every weapon except the two barrel tests as a player item", () => {
    const weapons = WeaponsFile.parse(dataFile("weapons.json")).weapons;
    const excluded = weapons
      .filter((weapon) => {
        const item = catalog.item(weapon.id);
        return item === undefined || !catalog.isPlayerItem(item);
      })
      .map((weapon) => weapon.id)
      .sort();
    expect(excluded).toEqual(["Id.Item.ArtilleryBarrelTest", "Id.Item.LeapordBarrel"]);
  });
});
