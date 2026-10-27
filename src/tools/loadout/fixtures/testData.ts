import { buildCatalog, sameId } from "@/core/catalog";
import type { Item } from "@/core/data";
import { fixtureWith } from "@/core/data/testing";
import { AmmoFile } from "@/core/data/schemas/ammo";
import { AttachmentsFile } from "@/core/data/schemas/attachments";
import { EquipmentFile } from "@/core/data/schemas/equipment";
import { ItemsFile } from "@/core/data/schemas/items";
import { MetaFile } from "@/core/data/schemas/meta";
import { RolesFile } from "@/core/data/schemas/roles";
import { TagsFile } from "@/core/data/schemas/tags";
import { WeaponsFile } from "@/core/data/schemas/weapons";
import { buildWeaponIndex } from "@/core/weapons";
import ammoJson from "@/test/fixtures/data/25937608/ammo.json";
import attachmentsJson from "@/test/fixtures/data/25937608/attachments.json";
import equipmentJson from "@/test/fixtures/data/25937608/equipment.json";
import rolesJson from "@/test/fixtures/data/25937608/roles.json";
import tagsJson from "@/test/fixtures/data/25937608/tags.json";
import weaponsJson from "@/test/fixtures/data/25937608/weapons.json";
import itemsExtra from "./items-extra.json";
import metaJson from "./meta.json";

export const FIXTURE_BUILD = "25937608";

export const loadoutFixtures: Record<string, unknown> = {
  [`${FIXTURE_BUILD}/items.json`]: fixtureWith(`${FIXTURE_BUILD}/items.json`, "items", itemsExtra),
  [`${FIXTURE_BUILD}/meta.json`]: metaJson,
};

export const itemsFile = ItemsFile.parse(loadoutFixtures[`${FIXTURE_BUILD}/items.json`]);
export const equipmentFile = EquipmentFile.parse(equipmentJson);
export const metaFile = MetaFile.parse(metaJson);

export const catalog = buildCatalog({
  items: itemsFile,
  tags: TagsFile.parse(tagsJson),
  roles: RolesFile.parse(rolesJson),
});

export const weaponIndex = buildWeaponIndex({
  weapons: WeaponsFile.parse(weaponsJson),
  ammo: AmmoFile.parse(ammoJson),
  attachments: AttachmentsFile.parse(attachmentsJson),
  catalog,
});

export function fixtureItem(id: string): Item {
  const item = itemsFile.items.find((candidate) => sameId(candidate.id, id));
  if (item === undefined) {
    throw new Error(`No fixture item ${id}`);
  }
  return item;
}
