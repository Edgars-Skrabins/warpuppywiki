import { IdMap } from "@/core/catalog";

const TRIGGER_LABELS = new IdMap<string>()
  .set("Character", "Always")
  .set("Character.HeldItemUpdated", "When you switch items")
  .set("Item", "On your items");

export function triggerLabel(trigger: string): string {
  return TRIGGER_LABELS.get(trigger) ?? trigger;
}
