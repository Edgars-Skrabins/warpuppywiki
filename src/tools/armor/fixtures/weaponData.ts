import type { AmmoFile, AttachmentsFile, WeaponsFile } from "@/core/data";
import { buildWeaponIndex, type AmmoOption, type PlayerWeapon } from "@/core/weapons";
import { fixtureCatalog } from "./testData";

const shared = import.meta.glob<unknown>("/src/test/fixtures/data/25937608/{weapons,ammo,attachments}.json", {
  eager: true,
  import: "default",
});

const SHARED = "/src/test/fixtures/data/25937608/";

export const fixtureWeaponIndex = buildWeaponIndex({
  weapons: shared[`${SHARED}weapons.json`] as WeaponsFile,
  ammo: shared[`${SHARED}ammo.json`] as AmmoFile,
  attachments: shared[`${SHARED}attachments.json`] as AttachmentsFile,
  catalog: fixtureCatalog,
});

export function fixtureWeapon(id: string): PlayerWeapon {
  const weapon = fixtureWeaponIndex.weapon(id);
  if (!weapon) throw new Error(`No fixture weapon ${id}`);
  return weapon;
}

export function fixtureAmmo(weapon: PlayerWeapon, ammoType: string): AmmoOption {
  const ammo = fixtureWeaponIndex.ammoOptions(weapon).find((option) => option.ammoType === ammoType);
  if (!ammo) throw new Error(`No ${ammoType} ammo for ${weapon.id}`);
  return ammo;
}
