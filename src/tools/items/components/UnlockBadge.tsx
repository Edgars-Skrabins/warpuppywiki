import type { UnlockInfo } from "@/core/catalog";
import { Badge } from "@/ui";
import { unlockText } from "../logic/itemEntries";

export function UnlockBadge({ unlock }: { unlock: UnlockInfo | null }) {
  return unlock === null ? null : <Badge tone="info">{unlockText(unlock)}</Badge>;
}
