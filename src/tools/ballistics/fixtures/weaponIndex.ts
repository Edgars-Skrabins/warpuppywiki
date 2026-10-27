import { buildCatalog } from "@/core/catalog";
import type { AmmoFile, AttachmentsFile, ItemsFile, RolesFile, TagsFile, WeaponsFile } from "@/core/data";
import { buildWeaponIndex, type PlayerWeapon, type WeaponIndex } from "@/core/weapons";

const FIXTURE_DIR = "/src/test/fixtures/data/25937608";

const shared = import.meta.glob<unknown>(
  "/src/test/fixtures/data/25937608/{items,tags,roles,weapons,ammo,attachments}.json",
  { eager: true, import: "default" },
);

function file<T>(name: string): T {
  return shared[`${FIXTURE_DIR}/${name}.json`] as T;
}

const catalog = buildCatalog({
  items: file<ItemsFile>("items"),
  tags: file<TagsFile>("tags"),
  roles: file<RolesFile>("roles"),
});

export function fixtureWeaponIndex(weapons: WeaponsFile = file<WeaponsFile>("weapons")): WeaponIndex {
  return buildWeaponIndex({
    weapons,
    ammo: file<AmmoFile>("ammo"),
    attachments: file<AttachmentsFile>("attachments"),
    catalog,
  });
}

export function emptyWeaponIndex(): WeaponIndex {
  return fixtureWeaponIndex({ ...file<WeaponsFile>("weapons"), weapons: [] });
}

export function fixtureWeapon(index: WeaponIndex, id: string): PlayerWeapon {
  const weapon = index.weapon(id);
  if (weapon === undefined) {
    throw new Error(`No fixture weapon ${id}`);
  }
  return weapon;
}
