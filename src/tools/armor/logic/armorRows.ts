import { sameId, type Catalog, type PriceInfo, type UnlockInfo } from "@/core/catalog";
import type { Armor } from "@/core/data";
import { contextLabel, modifierText } from "./labels";

export type ArmorKind = "body" | "helmet";

export type ArmorCatalog = Pick<Catalog, "item" | "isPlayerItem" | "price" | "unlock">;

export interface ArmorRow {
  id: string;
  name: string;
  icon: string | null;
  kind: ArmorKind;
  armor: Armor;
  level: string;
  zones: readonly string[];
  durability: number | null;
  reduction: number | null;
  price: PriceInfo | null;
  weight: number | null;
  unlock: UnlockInfo | null;
  sideEffects: readonly string[];
}

const SLOT_BY_KIND: Record<ArmorKind, string> = { body: "Armor", helmet: "Helmet" };

export function armorRows(armor: readonly Armor[], catalog: ArmorCatalog, kind: ArmorKind): ArmorRow[] {
  return armor
    .filter((piece) => sameId(piece.slot, SLOT_BY_KIND[kind]))
    .flatMap((piece) => {
      const item = catalog.item(piece.id);
      if (item === undefined || !catalog.isPlayerItem(item)) {
        return [];
      }
      const firstStage = piece.stages[0];
      return [
        {
          id: piece.id,
          name: item.name,
          icon: item.icon ?? null,
          kind,
          armor: piece,
          level: contextLabel(piece.damageContext),
          zones: piece.coveredLocations,
          durability: piece.durability ?? null,
          reduction: firstStage === undefined ? null : firstStage.damageReduction / 100,
          price: catalog.price(piece.id),
          weight: item.weight ?? null,
          unlock: catalog.unlock(item),
          sideEffects: piece.modifiers.map(modifierText),
        },
      ];
    })
    .sort((a, b) => a.name.localeCompare(b.name, "en-US", { numeric: true }));
}
