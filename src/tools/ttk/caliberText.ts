import type { Catalog } from "@/core/catalog";
import type { PlayerWeapon } from "@/core/weapons";

export function caliberTextFor(catalog: Catalog): (weapon: PlayerWeapon) => string {
  return (weapon) =>
    weapon.stats.calibers.map((caliber) => catalog.tagText(`Item.Caliber.${caliber}`) ?? caliber).join(", ");
}
