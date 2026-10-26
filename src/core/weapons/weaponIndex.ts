import type { AmmoFile, Attachment, AttachmentsFile, Item, Projectile, Weapon, WeaponsFile } from "@/core/data";
import {
  hasTag,
  IdMap,
  normalizeId,
  sameId,
  type Archetype,
  type Catalog,
  type PriceInfo,
  type UnlockInfo,
} from "@/core/catalog";
import { ammoTypeFromVariationSuffix, ammoTypeOf, type AmmoTypeKey } from "./ammoTypes";
import { damageClassOf } from "./damageClass";
import type { FittedAttachment } from "./effectiveStats";
import { fitsSlot, type WeaponSlot } from "./fitsSlot";

export interface PlayerWeapon {
  id: string;
  name: string;
  stats: Weapon;
  item: Item;
  archetype: Archetype | null;
  inventorySlots: readonly string[];
  damageClass: string;
  price: PriceInfo | null;
  unlock: UnlockInfo | null;
  visibleSlots: readonly WeaponSlot[];
}

export interface AmmoOption {
  item: Item;
  projectile: Projectile | null;
  ammoType: AmmoTypeKey;
  price: PriceInfo | null;
  unlock: UnlockInfo | null;
}

export interface LoadedMagazine {
  ammoType: AmmoTypeKey;
  tag: string;
  price: PriceInfo;
}

export interface MagazineOption {
  attachment: Attachment;
  item: Item;
  capacity: number;
  calibers: readonly string[];
  empty: PriceInfo | null;
  loaded: readonly LoadedMagazine[];
}

export interface WeaponIndex {
  playerWeapons: readonly PlayerWeapon[];
  weapon(id: string): PlayerWeapon | undefined;
  slotOptions(weapon: PlayerWeapon, slot: string): readonly Attachment[];
  hiddenDefaults(weapon: PlayerWeapon): readonly FittedAttachment[];
  ammoOptions(weapon: PlayerWeapon): readonly AmmoOption[];
  magazineOptions(weapon: PlayerWeapon): readonly MagazineOption[];
  attachment(id: string): Attachment | undefined;
}

export interface WeaponIndexInput {
  weapons: WeaponsFile;
  ammo: AmmoFile;
  attachments: AttachmentsFile;
  catalog: Catalog;
}

const AMMO_TAG = "Item.Ammo";
const CHAMBER_SLOT = "Chamber";
const MAGAZINE_SLOT = "Magazine";
const MAGAZINE_TYPE = "Magazine";

interface PlayerAttachment {
  attachment: Attachment;
  item: Item;
}

function byId<T extends { id: string }>(records: readonly T[]): IdMap<T> {
  const map = new IdMap<T>();
  for (const record of records) {
    if (!map.has(record.id)) {
      map.set(record.id, record);
    }
  }
  return map;
}

function findSlot(weapon: PlayerWeapon, slot: string): WeaponSlot | undefined {
  return weapon.stats.slots.find((entry) => sameId(entry.slot, slot));
}

function defaultFirst<T>(entries: readonly T[], slot: WeaponSlot, idOf: (entry: T) => string): T[] {
  const fallback = slot.default;
  if (!fallback) {
    return [...entries];
  }
  return [
    ...entries.filter((entry) => sameId(idOf(entry), fallback)),
    ...entries.filter((entry) => !sameId(idOf(entry), fallback)),
  ];
}

function loadedVariations(catalog: Catalog, item: Item): LoadedMagazine[] {
  const prefix = `${normalizeId(item.id)}.`;
  return catalog.variations(item).flatMap((variation) => {
    const tag = normalizeId(variation.tag);
    const ammoType = tag.startsWith(prefix) ? ammoTypeFromVariationSuffix(tag.slice(prefix.length)) : null;
    return ammoType ? [{ ammoType, tag: variation.tag, price: variation.price }] : [];
  });
}

export function buildWeaponIndex({ weapons, ammo, attachments, catalog }: WeaponIndexInput): WeaponIndex {
  const attachmentsById = byId(attachments.attachments);

  const playerWeapons = weapons.weapons.flatMap((stats): PlayerWeapon[] => {
    const item = catalog.item(stats.id);
    if (!item || !catalog.isPlayerItem(item)) {
      return [];
    }
    const archetype = catalog.archetype(item);
    return [
      {
        id: item.id,
        name: item.name,
        stats,
        item,
        archetype,
        inventorySlots: catalog.slots(item),
        damageClass: damageClassOf(archetype?.id),
        price: catalog.price(item.id),
        unlock: catalog.unlock(item),
        visibleSlots: stats.slots.filter((slot) => !slot.hidden),
      },
    ];
  });
  const weaponsById = byId(playerWeapons);

  const playerAttachments = attachments.attachments.flatMap((attachment): PlayerAttachment[] => {
    const item = catalog.item(attachment.id);
    return item && catalog.isPlayerItem(item) ? [{ attachment, item }] : [];
  });

  const ammoItems = catalog.playerItems.filter((item) => hasTag(item.tags, AMMO_TAG));

  const projectileOf = (item: Item): Projectile | null =>
    ammo.projectiles.find((projectile) => projectile.items.some((id) => sameId(id, item.id))) ?? null;

  const fittingAttachments = (weapon: PlayerWeapon, slotName: string): PlayerAttachment[] => {
    const slot = findSlot(weapon, slotName);
    if (!slot) {
      return [];
    }
    const fitting = playerAttachments.filter((entry) => fitsSlot(entry.item, slot));
    return defaultFirst(fitting, slot, (entry) => entry.attachment.id);
  };

  return {
    playerWeapons,
    weapon: (id) => weaponsById.get(id),
    attachment: (id) => attachmentsById.get(id),
    slotOptions: (weapon, slot) => fittingAttachments(weapon, slot).map((entry) => entry.attachment),
    hiddenDefaults: (weapon) =>
      weapon.stats.slots.flatMap((slot): FittedAttachment[] => {
        const attachment = slot.hidden && slot.default ? attachmentsById.get(slot.default) : undefined;
        return attachment ? [{ slot: slot.slot, attachment, hiddenDefault: true }] : [];
      }),
    ammoOptions: (weapon) => {
      const chamber = findSlot(weapon, CHAMBER_SLOT);
      if (!chamber) {
        return [];
      }
      return ammoItems
        .filter((item) => fitsSlot(item, chamber))
        .map((item) => ({
          item,
          projectile: projectileOf(item),
          ammoType: ammoTypeOf(item),
          price: catalog.price(item.id),
          unlock: catalog.unlock(item),
        }));
    },
    magazineOptions: (weapon) =>
      fittingAttachments(weapon, MAGAZINE_SLOT).flatMap(({ attachment, item }): MagazineOption[] => {
        const magazine = attachment.magazine;
        if (!magazine || !sameId(attachment.type, MAGAZINE_TYPE)) {
          return [];
        }
        return [
          {
            attachment,
            item,
            capacity: magazine.capacity,
            calibers: magazine.calibers,
            empty: catalog.price(item.id),
            loaded: loadedVariations(catalog, item),
          },
        ];
      }),
  };
}
