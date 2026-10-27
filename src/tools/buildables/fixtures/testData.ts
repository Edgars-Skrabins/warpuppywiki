import { buildCatalog, type Catalog } from "@/core/catalog";
import type {
  AmmoFile,
  Buildable,
  BuildablesFile,
  DamageFile,
  Item,
  ItemsFile,
  Projectile,
  RolesFile,
  TagsFile,
} from "@/core/data";

const shared = import.meta.glob<unknown>("/src/test/fixtures/data/25937608/{items,damage,ammo,tags,roles}.json", {
  eager: true,
  import: "default",
});
const own = import.meta.glob<unknown>("./*.json", { eager: true, import: "default" });

const sharedItems = shared["/src/test/fixtures/data/25937608/items.json"] as ItemsFile;
const sharedDamage = shared["/src/test/fixtures/data/25937608/damage.json"] as DamageFile;
const sharedAmmo = shared["/src/test/fixtures/data/25937608/ammo.json"] as AmmoFile;
const sharedTags = shared["/src/test/fixtures/data/25937608/tags.json"] as TagsFile;
const sharedRoles = shared["/src/test/fixtures/data/25937608/roles.json"] as RolesFile;

export const buildablesFile = own["./buildables.json"] as BuildablesFile;
export const toolItems = own["./items.json"] as Item[];
export const toolDamageRules = own["./damageRules.json"] as DamageFile["rules"];
export const toolProjectiles = own["./projectiles.json"] as Projectile[];

export const fixtureItems: Item[] = [...sharedItems.items, ...toolItems];
export const fixtureRules: DamageFile["rules"] = [...sharedDamage.rules, ...toolDamageRules];
export const fixtureProjectiles: Projectile[] = [...sharedAmmo.projectiles, ...toolProjectiles];

export const fixtureCatalog: Catalog = buildCatalog({
  items: { ...sharedItems, items: fixtureItems },
  tags: sharedTags,
  roles: sharedRoles,
});

export function fixtureBuildable(name: string): Buildable {
  const buildable = buildablesFile.buildables.find((candidate) => candidate.name === name);
  if (!buildable) throw new Error(`No fixture buildable ${name}`);
  return buildable;
}

export function fixtureProjectile(itemId: string): Projectile {
  const projectile = fixtureProjectiles.find((candidate) =>
    candidate.items.some((id) => id.toLowerCase() === itemId.toLowerCase()),
  );
  if (!projectile) throw new Error(`No fixture projectile for ${itemId}`);
  return projectile;
}

export function fixtureItem(id: string): Item {
  const item = fixtureItems.find((candidate) => candidate.id.toLowerCase() === id.toLowerCase());
  if (!item) throw new Error(`No fixture item ${id}`);
  return item;
}
