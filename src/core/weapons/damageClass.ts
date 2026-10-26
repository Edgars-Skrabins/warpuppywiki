import { normalizeId } from "@/core/catalog";

const DAMAGE_CLASSES: Record<string, string> = {
  ar: "Weapon.AR",
  smg: "Weapon.SMG",
  lmg: "Weapon.LMG",
  shotgun: "Weapon.Shotgun",
  dmr: "Weapon.DMR",
  sniper: "Weapon.Sniper",
  pistol: "Weapon.Pistol",
  bow: "Weapon.CombatBow",
  launcher: "Weapon.Launcher",
};

export const UNIVERSAL_DAMAGE_CLASS = "Universal";

export function damageClassOf(archetypeId: string | null | undefined): string {
  return (archetypeId && DAMAGE_CLASSES[normalizeId(archetypeId)]) || UNIVERSAL_DAMAGE_CLASS;
}
