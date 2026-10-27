import { buildCatalog, sameId } from "@/core/catalog";
import type { Item } from "@/core/data";
import { fixtureWith } from "@/core/data/testing";
import { EquipmentFile } from "@/core/data/schemas/equipment";
import { ItemsFile } from "@/core/data/schemas/items";
import { MetaFile } from "@/core/data/schemas/meta";
import { RolesFile } from "@/core/data/schemas/roles";
import { TagsFile } from "@/core/data/schemas/tags";
import equipmentJson from "@/test/fixtures/data/25937608/equipment.json";
import rolesJson from "@/test/fixtures/data/25937608/roles.json";
import tagsJson from "@/test/fixtures/data/25937608/tags.json";
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

export function fixtureItem(id: string): Item {
  const item = itemsFile.items.find((candidate) => sameId(candidate.id, id));
  if (item === undefined) {
    throw new Error(`No fixture item ${id}`);
  }
  return item;
}
