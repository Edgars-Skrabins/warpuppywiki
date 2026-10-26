import { buildCatalog, sameId } from "@/core/catalog";
import type { Item } from "@/core/data";
import { ItemsFile } from "@/core/data/schemas/items";
import { RolesFile } from "@/core/data/schemas/roles";
import { TagsFile } from "@/core/data/schemas/tags";
import itemsJson from "@/test/fixtures/data/25937608/items.json";
import rolesJson from "@/test/fixtures/data/25937608/roles.json";
import tagsJson from "@/test/fixtures/data/25937608/tags.json";
import extraItems from "./items.json";

export const ITEMS_FIXTURE_PATH = "25937608/items.json";

const itemsFile = ItemsFile.parse({ ...itemsJson, items: [...itemsJson.items, ...extraItems] });

export const testCatalog = buildCatalog({
  items: itemsFile,
  tags: TagsFile.parse(tagsJson),
  roles: RolesFile.parse(rolesJson),
});

export function testItem(id: string): Item {
  const item = itemsFile.items.find((candidate) => sameId(candidate.id, id));
  if (item === undefined) {
    throw new Error(`No fixture item ${id}`);
  }
  return item;
}

export { extraItems };
