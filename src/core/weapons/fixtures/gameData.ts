import type { Attachment, Weapon } from "@/core/data";
import { buildCatalog, sameId } from "@/core/catalog";
import { AmmoFile } from "@/core/data/schemas/ammo";
import { AttachmentsFile } from "@/core/data/schemas/attachments";
import { ItemsFile } from "@/core/data/schemas/items";
import { RolesFile } from "@/core/data/schemas/roles";
import { TagsFile } from "@/core/data/schemas/tags";
import { WeaponsFile } from "@/core/data/schemas/weapons";
import ammoJson from "@/test/fixtures/data/25937608/ammo.json";
import attachmentsJson from "@/test/fixtures/data/25937608/attachments.json";
import itemsJson from "@/test/fixtures/data/25937608/items.json";
import rolesJson from "@/test/fixtures/data/25937608/roles.json";
import tagsJson from "@/test/fixtures/data/25937608/tags.json";
import weaponsJson from "@/test/fixtures/data/25937608/weapons.json";

export const weaponsFile = WeaponsFile.parse(weaponsJson);
export const ammoFile = AmmoFile.parse(ammoJson);
export const attachmentsFile = AttachmentsFile.parse(attachmentsJson);
export const itemsFile = ItemsFile.parse(itemsJson);

export const fixtureCatalog = buildCatalog({
  items: itemsFile,
  tags: TagsFile.parse(tagsJson),
  roles: RolesFile.parse(rolesJson),
});

export function fixtureWeapon(id: string): Weapon {
  const weapon = weaponsFile.weapons.find((candidate) => sameId(candidate.id, id));
  if (weapon === undefined) {
    throw new Error(`No fixture weapon ${id}`);
  }
  return weapon;
}

export function fixtureAttachment(id: string): Attachment {
  const attachment = attachmentsFile.attachments.find((candidate) => sameId(candidate.id, id));
  if (attachment === undefined) {
    throw new Error(`No fixture attachment ${id}`);
  }
  return attachment;
}

export function fixtureSlot(weapon: Weapon, slot: string): Weapon["slots"][number] {
  const found = weapon.slots.find((candidate) => sameId(candidate.slot, slot));
  if (found === undefined) {
    throw new Error(`No slot ${slot} on ${weapon.id}`);
  }
  return found;
}
