import { buildCatalog, type Catalog } from "@/core/catalog";
import type { Armor, DamageFile, EquipmentFile, Item, ItemsFile, RolesFile, TagsFile } from "@/core/data";

const shared = import.meta.glob<unknown>("/src/test/fixtures/data/25937608/{items,equipment,damage,tags,roles}.json", {
  eager: true,
  import: "default",
});
const own = import.meta.glob<unknown>("./*.json", { eager: true, import: "default" });

const SHARED = "/src/test/fixtures/data/25937608/";

const sharedItems = shared[`${SHARED}items.json`] as ItemsFile;
const sharedEquipment = shared[`${SHARED}equipment.json`] as EquipmentFile;

export const toolItems = own["./items.json"] as Item[];
export const toolArmor = own["./armor.json"] as Armor[];

export const fixtureDamage = shared[`${SHARED}damage.json`] as DamageFile;

export const fixtureEquipment: EquipmentFile = {
  ...sharedEquipment,
  armor: [...sharedEquipment.armor, ...toolArmor],
};

export const fixtureCatalog: Catalog = buildCatalog({
  items: { ...sharedItems, items: [...sharedItems.items, ...toolItems] },
  tags: shared[`${SHARED}tags.json`] as TagsFile,
  roles: shared[`${SHARED}roles.json`] as RolesFile,
});

export function fixtureArmor(name: string): Armor {
  const armor = fixtureEquipment.armor.find((piece) => piece.name === name);
  if (!armor) throw new Error(`No fixture armor ${name}`);
  return armor;
}
