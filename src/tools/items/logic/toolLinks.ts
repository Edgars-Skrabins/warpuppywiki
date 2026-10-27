import type { Item } from "@/core/data";
import type { ItemCategory } from "./itemCategory";

export interface ToolLink {
  label: string;
  to: string;
}

export function toolLinkFor(item: Item, category: ItemCategory): ToolLink | null {
  switch (category) {
    case "weapons":
      return { label: "Open in Arsenal", to: `/arsenal?w=${encodeURIComponent(item.id)}` };
    case "vehicles":
      return { label: "Open in Vehicles", to: "/vehicles" };
    case "armor":
      return { label: "Open in Armor & Weight", to: "/armor" };
    default:
      return null;
  }
}
