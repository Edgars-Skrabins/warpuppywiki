import type { BadgeTone } from "@/ui";
import type { EntityStatus } from "../diff/types";

export const STATUS_BADGES: Record<EntityStatus, { label: string; tone: BadgeTone }> = {
  added: { label: "Added", tone: "success" },
  removed: { label: "Removed", tone: "danger" },
  changed: { label: "Changed", tone: "info" },
};
