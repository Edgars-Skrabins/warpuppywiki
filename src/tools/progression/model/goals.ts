import { IdMap, sameId, type Catalog, type PriceInfo, type UnlockInfo } from "@/core/catalog";
import type { Item, Role } from "@/core/data";
import type { PlayerWeapon, WeaponIndex } from "@/core/weapons";

export interface GatedItem {
  item: Item;
  unlock: UnlockInfo;
  price: PriceInfo | null;
}

export const CAREER_LABEL = "Career";

export function isCareerGate(unlock: UnlockInfo, roles: readonly Role[]): boolean {
  return !roles.some((role) => sameId(role.id, unlock.role));
}

export function gateLabel(unlock: UnlockInfo, roles: readonly Role[]): string {
  return isCareerGate(unlock, roles) ? CAREER_LABEL : unlock.roleLabel;
}

export function gatedItems(catalog: Catalog): GatedItem[] {
  return catalog.playerItems
    .flatMap((item) => {
      const unlock = catalog.unlock(item);
      return unlock === null ? [] : [{ item, unlock, price: catalog.price(item.id) }];
    })
    .sort(
      (a, b) =>
        a.unlock.role.localeCompare(b.unlock.role) ||
        a.unlock.level - b.unlock.level ||
        a.item.name.localeCompare(b.item.name),
    );
}

export function gatedItemMap(gated: readonly GatedItem[]): IdMap<GatedItem> {
  const map = new IdMap<GatedItem>();
  for (const entry of gated) {
    map.set(entry.item.id, entry);
  }
  return map;
}

export function goalsForRoleUpTo(gated: readonly GatedItem[], role: string, level: number): string[] {
  return gated
    .filter((entry) => sameId(entry.unlock.role, role) && entry.unlock.level <= level)
    .map((entry) => entry.item.id);
}

export function goalsForWeapon(weapon: PlayerWeapon, index: WeaponIndex, gated: readonly GatedItem[]): string[] {
  const byId = gatedItemMap(gated);
  const candidates = [
    weapon.id,
    ...weapon.visibleSlots.flatMap((slot) => index.slotOptions(weapon, slot.slot).map((attachment) => attachment.id)),
    ...index.magazineOptions(weapon).map((magazine) => magazine.item.id),
    ...index.ammoOptions(weapon).map((ammo) => ammo.item.id),
  ];
  const seen = new IdMap<true>();
  const ids: string[] = [];
  for (const id of candidates) {
    const entry = byId.get(id);
    if (entry !== undefined && !seen.has(entry.item.id)) {
      seen.set(entry.item.id, true);
      ids.push(entry.item.id);
    }
  }
  return ids;
}

export function ladderFor(gated: readonly GatedItem[], role: string): GatedItem[] {
  return gated.filter((entry) => sameId(entry.unlock.role, role));
}
