import { buildCatalog } from "@/core/catalog";
import type {
  AmmoFile,
  AttachmentsFile,
  DamageFile,
  EquipmentFile,
  ItemsFile,
  RolesFile,
  TagsFile,
  WeaponsFile,
} from "@/core/data";
import { buildWeaponIndex, type PlayerWeapon } from "@/core/weapons";
import type { ArsenalData } from "../logic/weaponRows";

const FIXTURE_DIR = "/src/test/fixtures/data/25937608";

const shared = import.meta.glob<unknown>(
  "/src/test/fixtures/data/25937608/{items,tags,roles,weapons,ammo,attachments,damage,equipment}.json",
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

export const testData: ArsenalData = {
  catalog,
  index: buildWeaponIndex({
    weapons: file<WeaponsFile>("weapons"),
    ammo: file<AmmoFile>("ammo"),
    attachments: file<AttachmentsFile>("attachments"),
    catalog,
  }),
  damage: file<DamageFile>("damage"),
  equipment: file<EquipmentFile>("equipment"),
};

export function testWeapon(id: string): PlayerWeapon {
  const weapon = testData.index.weapon(id);
  if (weapon === undefined) {
    throw new Error(`No fixture weapon ${id}`);
  }
  return weapon;
}
