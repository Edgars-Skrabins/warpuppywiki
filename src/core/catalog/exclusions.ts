import type { Item } from "@/core/data";
import { normalizeId, sameId } from "./ids";
import { hasTag } from "./tags";

export type NonPlayerReason = "developer" | "sandbox" | "vehicle-part" | "listed";

export const NON_PLAYER_ITEM_IDS: readonly string[] = [
  "Id.Item.LeapordBarrel",
  "Id.Item.CantedIrons",
  "Id.Item.ArtilleryBarrelTest",
  "Id.Item.DebugHomingRocketAmmo",
];

export function nonPlayerReason(item: Item): NonPlayerReason | null {
  if (item.developer === true) {
    return "developer";
  }
  if (normalizeId(item.id).endsWith(".sandbox")) {
    return "sandbox";
  }
  if (hasTag(item.tags, "Inventory.Slot.Vehicle")) {
    return "vehicle-part";
  }
  if (NON_PLAYER_ITEM_IDS.some((id) => sameId(id, item.id))) {
    return "listed";
  }
  return null;
}
