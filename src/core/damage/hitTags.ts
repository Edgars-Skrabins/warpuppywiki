import { stripPrefix, tagsUnder } from "@/core/catalog";
import type { Projectile } from "@/core/data";
import type { AmmoOption, PlayerWeapon } from "@/core/weapons";
import { coveringPiece } from "./armor";
import type { HitLocation, Target } from "./types";
import { weaponClassTag, weaponDamageTag } from "./weaponTags";

const DAMAGE_PREFIX = "Meta.Damage";
const ARMS_PREFIX = "Meta.Damage.Arms";

function withParents(tag: string): string[] {
  const parts = tag.split(".");
  return parts.map((_, index) => parts.slice(0, index + 1).join("."));
}

export function armsClassOf(projectile: Projectile): string | null {
  const tag = tagsUnder(projectile.damageContext, ARMS_PREFIX)[0];
  return tag === undefined ? null : stripPrefix(tag, ARMS_PREFIX);
}

export function damageTypeTag(projectile: Projectile): string | null {
  return projectile.damageType ? stripPrefix(projectile.damageType, DAMAGE_PREFIX) : null;
}

export function sourceTags(weapon: PlayerWeapon, ammo: AmmoOption): string[] {
  const tags: string[] = [];
  const projectile = ammo.projectile;
  const damageType = projectile === null ? null : damageTypeTag(projectile);
  if (damageType !== null) {
    tags.push(...withParents(damageType));
  }
  if (ammo.ammoType !== "FMJ") {
    tags.push(`AmmoModifier.${ammo.ammoType}`);
  }
  const armsClass = projectile === null ? null : armsClassOf(projectile);
  if (armsClass !== null) {
    tags.push(`Arms.${armsClass}`);
  }
  const classTag = weaponClassTag(weapon);
  if (classTag !== null) {
    tags.push(classTag);
  }
  const specific = weaponDamageTag(weapon);
  if (specific !== null) {
    tags.push(specific);
  }
  return tags;
}

export function targetTags(target: Target, location: HitLocation): string[] {
  const worn = [target.body?.armor, target.helmet?.armor, ...target.extras].filter((armor) => armor !== undefined);
  const everywhere = worn.filter((armor) => armor.coveredLocations.length === 0).map((armor) => armor.damageContext);
  const covering = coveringPiece(target, location);
  return covering === null ? everywhere : [covering.piece.armor.damageContext, ...everywhere];
}

export function locationTag(location: HitLocation): string {
  return `Infantry.${location}`;
}
