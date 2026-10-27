import { beforeAll, describe, expect, it } from "vitest";
import { buildCatalog } from "@/core/catalog";
import { AmmoFile } from "@/core/data/schemas/ammo";
import { AttachmentsFile } from "@/core/data/schemas/attachments";
import { ItemsFile } from "@/core/data/schemas/items";
import { RolesFile } from "@/core/data/schemas/roles";
import { TagsFile } from "@/core/data/schemas/tags";
import { WeaponsFile } from "@/core/data/schemas/weapons";
import { buildWeaponIndex, type WeaponIndex } from "./weaponIndex";

const files: Record<string, unknown> = import.meta.glob(
  [
    "/public/data/builds.json",
    "/public/data/*/items.json",
    "/public/data/*/tags.json",
    "/public/data/*/roles.json",
    "/public/data/*/weapons.json",
    "/public/data/*/ammo.json",
    "/public/data/*/attachments.json",
  ],
  { eager: true, import: "default" },
);

const builds = files["/public/data/builds.json"] as { latest: string } | undefined;

function dataFile(file: string): unknown {
  return files[`/public/data/${builds?.latest ?? ""}/${file}`];
}

describe.skipIf(!builds)("weapon index against real data", () => {
  let index: WeaponIndex;

  beforeAll(() => {
    index = buildWeaponIndex({
      weapons: WeaponsFile.parse(dataFile("weapons.json")),
      ammo: AmmoFile.parse(dataFile("ammo.json")),
      attachments: AttachmentsFile.parse(dataFile("attachments.json")),
      catalog: buildCatalog({
        items: ItemsFile.parse(dataFile("items.json")),
        tags: TagsFile.parse(dataFile("tags.json")),
        roles: RolesFile.parse(dataFile("roles.json")),
      }),
    });
  });

  it("gives every player weapon with a caliber an ammo option with a projectile", () => {
    const anomalies = index.playerWeapons.flatMap((weapon) =>
      index
        .ammoOptions(weapon)
        .filter((option) => option.projectile === null || option.price === null)
        .map(
          (option) =>
            `${weapon.id}: ${option.item.id}${option.projectile ? "" : " (no projectile)"}${option.price ? "" : " (not sold)"}`,
        ),
    );
    console.info(`Ammo anomalies: ${anomalies.join(", ") || "none"}`);
    const missing = index.playerWeapons
      .filter((weapon) => weapon.stats.calibers.length > 0)
      .filter((weapon) => !index.ammoOptions(weapon).some((option) => option.projectile !== null))
      .map((weapon) => weapon.id);
    expect(missing).toEqual([]);
  });
});
