import type { Item, ItemsFile, RolesFile, TagsFile } from "@/core/data";
import { IdMap } from "./ids";
import { nonPlayerReason, type NonPlayerReason } from "./exclusions";
import { buildVendorIndex, priceOf, type PriceInfo } from "./pricing";
import { roleLabel, xpForLevel } from "./roles";
import { stripPrefix, tagMatches, tagsUnder } from "./tags";

export interface UnlockInfo {
  role: string;
  roleLabel: string;
  level: number;
  cost: number;
  xpRequired: number | null;
}

export interface Archetype {
  id: string;
  label: string;
}

export interface Catalog {
  items: readonly Item[];
  playerItems: readonly Item[];
  item(id: string): Item | undefined;
  isPlayerItem(item: Item): boolean;
  nonPlayerReason(item: Item): NonPlayerReason | null;
  price(tag: string): PriceInfo | null;
  variations(item: Item): readonly { tag: string; price: PriceInfo }[];
  unlock(item: Item): UnlockInfo | null;
  archetype(item: Item): Archetype | null;
  slots(item: Item): readonly string[];
  tagText(tag: string): string | null;
  roleLabel(role: string): string;
}

export interface CatalogSources {
  items: ItemsFile;
  tags: TagsFile;
  roles: RolesFile;
}

const ARCHETYPE_PREFIX = "Item.Archetype";
const SLOT_PREFIX = "Inventory.Slot";

export function buildCatalog({ items, tags, roles }: CatalogSources): Catalog {
  const itemsById = new IdMap<Item>();
  for (const item of items.items) {
    itemsById.set(item.id, item);
  }
  const tagTexts = new IdMap<string>();
  for (const entry of tags.tags) {
    tagTexts.set(entry.tag, entry.text);
  }
  const vendorIndex = buildVendorIndex(items.items);
  const roleLabels = new IdMap<string>();

  function labelOf(role: string): string {
    const known = roleLabels.get(role);
    if (known !== undefined) {
      return known;
    }
    const label = roleLabel(tagTexts, role);
    roleLabels.set(role, label);
    return label;
  }

  function tagText(tag: string): string | null {
    return tagTexts.get(tag) ?? null;
  }

  return {
    items: items.items,
    playerItems: items.items.filter((item) => nonPlayerReason(item) === null),
    item: (id) => itemsById.get(id),
    isPlayerItem: (item) => nonPlayerReason(item) === null,
    nonPlayerReason,
    price: (tag) => priceOf(vendorIndex, tag),
    variations: (item) =>
      item.vendor.flatMap((entry) => {
        const price = priceOf(vendorIndex, entry.tag);
        return price === null ? [] : [{ tag: entry.tag, price }];
      }),
    unlock: (item) =>
      item.unlock === null
        ? null
        : {
            role: item.unlock.role,
            roleLabel: labelOf(item.unlock.role),
            level: item.unlock.level,
            cost: item.unlock.cost,
            xpRequired: xpForLevel(roles.roles, item.unlock.role, item.unlock.level),
          },
    archetype: (item) => {
      const tag = tagsUnder(item.tags, ARCHETYPE_PREFIX)[0];
      if (tag === undefined) {
        return null;
      }
      const id = stripPrefix(tag, ARCHETYPE_PREFIX);
      return { id, label: tagText(`${ARCHETYPE_PREFIX}.${id}`) ?? item.subtitle ?? id };
    },
    slots: (item) =>
      tagsUnder(item.tags, SLOT_PREFIX)
        .map((tag) => stripPrefix(tag, SLOT_PREFIX))
        .filter((slot) => !tagMatches(slot, "Vehicle")),
    tagText,
    roleLabel: labelOf,
  };
}
