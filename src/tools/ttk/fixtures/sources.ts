import { buildCatalog } from "@/core/catalog";
import { AmmoFile } from "@/core/data/schemas/ammo";
import { AttachmentsFile } from "@/core/data/schemas/attachments";
import { DamageFile } from "@/core/data/schemas/damage";
import { EquipmentFile } from "@/core/data/schemas/equipment";
import { ItemsFile } from "@/core/data/schemas/items";
import { RolesFile } from "@/core/data/schemas/roles";
import { TagsFile } from "@/core/data/schemas/tags";
import { WeaponsFile } from "@/core/data/schemas/weapons";
import { buildWeaponIndex } from "@/core/weapons";
import ammoJson from "@/test/fixtures/data/25937608/ammo.json";
import attachmentsJson from "@/test/fixtures/data/25937608/attachments.json";
import damageJson from "@/test/fixtures/data/25937608/damage.json";
import equipmentJson from "@/test/fixtures/data/25937608/equipment.json";
import itemsJson from "@/test/fixtures/data/25937608/items.json";
import rolesJson from "@/test/fixtures/data/25937608/roles.json";
import tagsJson from "@/test/fixtures/data/25937608/tags.json";
import weaponsJson from "@/test/fixtures/data/25937608/weapons.json";
import type { MatchupSources } from "../logic/buildScenario";

const catalog = buildCatalog({
  items: ItemsFile.parse(itemsJson),
  tags: TagsFile.parse(tagsJson),
  roles: RolesFile.parse(rolesJson),
});

export const fixtureSources: MatchupSources = {
  index: buildWeaponIndex({
    weapons: WeaponsFile.parse(weaponsJson),
    ammo: AmmoFile.parse(ammoJson),
    attachments: AttachmentsFile.parse(attachmentsJson),
    catalog,
  }),
  damage: DamageFile.parse(damageJson),
  equipment: EquipmentFile.parse(equipmentJson),
  catalog,
};
