import { sameId } from "@/core/catalog";
import type { DamageFile } from "@/core/data";
import type { ArmorItem, ArmorSlot, HitLocation, Target, WornPiece } from "./types";

export interface CoveringPiece {
  slot: ArmorSlot;
  piece: WornPiece;
}

export function wearStage(armor: ArmorItem, durability: number): number {
  const stages = armor.stages.length;
  const maxDurability = armor.durability ?? 0;
  if (stages === 0 || maxDurability <= 0) {
    return 0;
  }
  const worn = Math.floor((1 - durability / maxDurability) * stages);
  return Math.min(stages - 1, Math.max(0, worn));
}

export function covers(armor: ArmorItem, location: HitLocation): boolean {
  return armor.coveredLocations.some((covered) => sameId(covered, location));
}

export function coveringPiece(target: Target, location: HitLocation): CoveringPiece | null {
  const worn: CoveringPiece[] = [];
  if (target.helmet) {
    worn.push({ slot: "helmet", piece: target.helmet });
  }
  if (target.body) {
    worn.push({ slot: "body", piece: target.body });
  }
  return worn.find(({ piece }) => piece.durability > 0 && covers(piece.armor, location)) ?? null;
}

export function effectiveness(damage: DamageFile, ammoType: string, armsClass: string | null): number {
  const entry = damage.ammoTypes.find((candidate) => sameId(candidate.ammoType, ammoType));
  if (entry === undefined) {
    return 1;
  }
  const byClass =
    armsClass === null
      ? undefined
      : Object.entries(entry.byArmsClass).find(([armsKey]) => sameId(armsKey, armsClass))?.[1];
  return byClass ?? entry.modifier;
}
