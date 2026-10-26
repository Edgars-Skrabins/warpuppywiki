import type { Weapon } from "@/core/data";
import { hasTag, sameId } from "@/core/catalog";

export type WeaponSlot = Weapon["slots"][number];

export interface SlotCandidate {
  id: string;
  tags: readonly string[];
}

function matchesAny(candidate: SlotCandidate, ids: readonly string[], contexts: readonly string[]): boolean {
  return ids.some((id) => sameId(id, candidate.id)) || contexts.some((context) => hasTag(candidate.tags, context));
}

export function fitsSlot(candidate: SlotCandidate, slot: WeaponSlot): boolean {
  if (matchesAny(candidate, slot.blockedItems, slot.blockedContexts)) {
    return false;
  }
  return matchesAny(candidate, slot.items, slot.contexts);
}

export function itemsFittingSlot<T extends SlotCandidate>(slot: WeaponSlot, candidates: readonly T[]): T[] {
  return candidates.filter((candidate) => fitsSlot(candidate, slot));
}
