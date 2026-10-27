import { buildCatalog, sameId } from "@/core/catalog";
import type { Projectile } from "@/core/data";
import { AmmoFile, Projectile as ProjectileSchema } from "@/core/data/schemas/ammo";
import { AttachmentsFile } from "@/core/data/schemas/attachments";
import { DamageFile } from "@/core/data/schemas/damage";
import { Armor, EquipmentFile } from "@/core/data/schemas/equipment";
import { Item, ItemsFile } from "@/core/data/schemas/items";
import { RolesFile } from "@/core/data/schemas/roles";
import { TagsFile } from "@/core/data/schemas/tags";
import { WeaponsFile } from "@/core/data/schemas/weapons";
import ammoJson from "@/test/fixtures/data/25937608/ammo.json";
import attachmentsJson from "@/test/fixtures/data/25937608/attachments.json";
import damageJson from "@/test/fixtures/data/25937608/damage.json";
import equipmentJson from "@/test/fixtures/data/25937608/equipment.json";
import itemsJson from "@/test/fixtures/data/25937608/items.json";
import rolesJson from "@/test/fixtures/data/25937608/roles.json";
import tagsJson from "@/test/fixtures/data/25937608/tags.json";
import weaponsJson from "@/test/fixtures/data/25937608/weapons.json";
import { ammoTypeOf, buildWeaponIndex, type AmmoOption, type PlayerWeapon } from "@/core/weapons";
import extraArmorJson from "./fixtures/armor.json";
import extraItemsJson from "./fixtures/items.json";
import extraProjectilesJson from "./fixtures/projectiles.json";
import type { ArmorItem, HitLocation, Scenario, Target, WornPiece } from "./types";

export const damageFile = DamageFile.parse(damageJson);
const equipment = EquipmentFile.parse(equipmentJson);
const ammo = AmmoFile.parse(ammoJson);
const itemsFile = ItemsFile.parse(itemsJson);
const extraItems = Item.array().parse(extraItemsJson);
const projectiles: Projectile[] = [...ammo.projectiles, ...ProjectileSchema.array().parse(extraProjectilesJson)];
const armorItems: ArmorItem[] = [...equipment.armor, ...Armor.array().parse(extraArmorJson)];

const catalog = buildCatalog({
  items: { ...itemsFile, items: [...itemsFile.items, ...extraItems] },
  tags: TagsFile.parse(tagsJson),
  roles: RolesFile.parse(rolesJson),
});

const weaponIndex = buildWeaponIndex({
  weapons: WeaponsFile.parse(weaponsJson),
  ammo,
  attachments: AttachmentsFile.parse(attachmentsJson),
  catalog,
});

function required<T>(value: T | undefined, what: string): T {
  if (value === undefined) {
    throw new Error(`No fixture ${what}`);
  }
  return value;
}

export function taggedWeapon(id: string): Pick<PlayerWeapon, "id" | "item" | "archetype"> {
  const item = required(catalog.item(id), id);
  return { id: item.id, item, archetype: catalog.archetype(item) };
}

export function testWeapon(id: string): PlayerWeapon {
  return required(weaponIndex.weapon(id), `player weapon ${id}`);
}

export function testAmmo(itemId: string): AmmoOption {
  const item = required(catalog.item(itemId), itemId);
  const projectile = projectiles.find((candidate) => candidate.items.some((id) => sameId(id, itemId))) ?? null;
  return { item, projectile, ammoType: ammoTypeOf(item), price: null, unlock: null };
}

export function weaponAmmo(weapon: PlayerWeapon, itemId: string): AmmoOption {
  return required(
    weaponIndex.ammoOptions(weapon).find((option) => sameId(option.item.id, itemId)),
    `ammo ${itemId} for ${weapon.id}`,
  );
}

export function testArmor(id: string): ArmorItem {
  return required(
    armorItems.find((armor) => sameId(armor.id, id)),
    `armor ${id}`,
  );
}

export function newPiece(id: string): WornPiece {
  const armor = testArmor(id);
  return { armor, durability: armor.durability ?? 0 };
}

export function testTarget(overrides: Partial<Target> = {}): Target {
  return { health: 100, body: null, helmet: null, extras: [], ...overrides };
}

export function ak74Scenario(overrides: Partial<Scenario> = {}): Scenario {
  const ak74 = testWeapon("Id.Item.AK74M");
  return {
    damage: damageFile,
    weapon: ak74,
    ammo: weaponAmmo(ak74, "Id.Item.545mm"),
    distance: 100,
    pattern: ["Torso.Upper"] satisfies HitLocation[],
    target: testTarget(),
    ...overrides,
  };
}

export function rounded(value: number): number {
  return Number(value.toFixed(9));
}
