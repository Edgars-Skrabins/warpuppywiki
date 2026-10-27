import { IdMap, stripPrefix, tagsUnder } from "@/core/catalog";
import type { PlayerWeapon } from "@/core/weapons";

export const WEAPON_DAMAGE_TAGS: Readonly<Record<string, string>> = {
  "Id.Item.WEPN_026": "Weapon.Pistol.M1911",
  "Id.Item.AK74M": "Weapon.AR.AK47M",
  "Id.Item.WEPN_030": "Weapon.AR.Fal",
  "Id.Item.LMG_02": "Weapon.LMG.LMG_02",
  "Id.Item.SVDM": "Weapon.DMR.SVDM",
  "Id.Item.RFB": "Weapon.DMR.RFB",
  "Id.Item.Mosin": "Weapon.Sniper.Mosin",
  "Id.Item.MK22": "Weapon.Sniper.MRAD",
  "Id.Item.SMG_03": "Weapon.SMG.SMG3",
  "Id.Item.M500": "Weapon.Shotgun.M12G",
};

const knownTags = new IdMap<string>();
for (const [id, tag] of Object.entries(WEAPON_DAMAGE_TAGS)) {
  knownTags.set(id, tag);
}

const ITEM_WEAPON_PREFIX = "Item.Weapon";

type TaggedWeapon = Pick<PlayerWeapon, "id" | "item" | "archetype">;

export function weaponClassTag(weapon: Pick<PlayerWeapon, "archetype">): string | null {
  return weapon.archetype === null ? null : `Weapon.${weapon.archetype.id}`;
}

export function weaponDamageTag(weapon: TaggedWeapon): string | null {
  const known = knownTags.get(weapon.id);
  if (known !== undefined) {
    return known;
  }
  const classTag = weaponClassTag(weapon);
  const itemTag = tagsUnder(weapon.item.tags, ITEM_WEAPON_PREFIX)[0];
  if (classTag === null || itemTag === undefined) {
    return null;
  }
  return `${classTag}.${stripPrefix(itemTag, ITEM_WEAPON_PREFIX)}`;
}
