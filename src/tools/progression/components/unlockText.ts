import { formatCash } from "@/ui";
import type { GatedItem } from "../model/goals";

export function unlockText({ unlock, price }: GatedItem): string {
  const parts = [`Level ${unlock.level}`, `Unlock ${formatCash(unlock.cost, { zeroAsFree: true })}`];
  if (price !== null) {
    parts.push(`Shop ${formatCash(price.price, { zeroAsFree: true })}`);
  }
  return parts.join(" · ");
}
