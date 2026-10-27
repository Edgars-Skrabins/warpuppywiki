import type { Attachment } from "@/core/data";
import { sameId } from "@/core/catalog";
import {
  effectiveStats,
  type EffectiveStats,
  type FittedAttachment,
  type PlayerWeapon,
  type WeaponIndex,
} from "@/core/weapons";
import { recoilPath, type RecoilPath } from "./recoilPath";
import { recoilStats, type RecoilStatsSummary } from "./recoilStats";

export type SlotSelections = Readonly<Record<string, string | null>>;

export const MAGAZINE_SLOT = "Magazine";

export function hasRecoilPattern(weapon: PlayerWeapon): boolean {
  return (weapon.stats.recoil?.pattern.length ?? 0) > 0;
}

export function selectedAttachmentId(weapon: PlayerWeapon, slot: string, selections: SlotSelections): string | null {
  const chosen = Object.entries(selections).find(([key]) => sameId(key, slot));
  if (chosen !== undefined) {
    return chosen[1];
  }
  return weapon.visibleSlots.find((candidate) => sameId(candidate.slot, slot))?.default ?? null;
}

export function selectedAttachment(
  index: WeaponIndex,
  weapon: PlayerWeapon,
  slot: string,
  selections: SlotSelections,
): Attachment | null {
  const id = selectedAttachmentId(weapon, slot, selections);
  if (id === null) {
    return null;
  }
  return index.slotOptions(weapon, slot).find((option) => sameId(option.id, id)) ?? null;
}

export function fittedAttachments(
  index: WeaponIndex,
  weapon: PlayerWeapon,
  selections: SlotSelections,
): FittedAttachment[] {
  const visible = weapon.visibleSlots.flatMap((slot) => {
    const attachment = selectedAttachment(index, weapon, slot.slot, selections);
    return attachment === null ? [] : [{ slot: slot.slot, attachment, hiddenDefault: false }];
  });
  return [...index.hiddenDefaults(weapon), ...visible];
}

export interface WeaponRecoil {
  stats: EffectiveStats;
  path: RecoilPath;
  summary: RecoilStatsSummary;
}

export function weaponRecoil(index: WeaponIndex, weapon: PlayerWeapon, selections: SlotSelections): WeaponRecoil {
  const stats = effectiveStats(weapon.stats, fittedAttachments(index, weapon, selections));
  const multipliers = { vertical: stats.verticalRecoil.value, horizontal: stats.horizontalRecoil.value };
  const recoil = weapon.stats.recoil;
  return {
    stats,
    path: recoilPath(
      recoil?.pattern ?? [],
      multipliers,
      stats.magazineCapacity,
      recoil?.afterPatternPitch ?? null,
      recoil?.afterPatternYaw ?? null,
    ),
    summary: recoilStats(recoil, multipliers),
  };
}
