import type { Item } from "@/core/data";
import { ItemsFile } from "@/core/data/schemas/items";
import { RolesFile } from "@/core/data/schemas/roles";
import { TagsFile } from "@/core/data/schemas/tags";
import itemsJson from "@/test/fixtures/data/25937608/items.json";
import rolesJson from "@/test/fixtures/data/25937608/roles.json";
import tagsJson from "@/test/fixtures/data/25937608/tags.json";
import { sameId } from "../ids";

export const itemsFile = ItemsFile.parse(itemsJson);
export const tagsFile = TagsFile.parse(tagsJson);
export const rolesFile = RolesFile.parse(rolesJson);

export function fixtureItem(id: string): Item {
  const item = itemsFile.items.find((candidate) => sameId(candidate.id, id));
  if (item === undefined) {
    throw new Error(`No fixture item ${id}`);
  }
  return item;
}
