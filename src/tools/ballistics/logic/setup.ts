import { sameId } from "@/core/catalog";
import { falloffAt, type AmmoOption, type PlayerWeapon, type WeaponIndex } from "@/core/weapons";
import { rangeCard, type RangeCardRow } from "./rangeCard";
import { ballisticProjectileOf, simulate, type BallisticProjectile, type TrajectorySample } from "./trajectory";

export const MAX_DISTANCES = [300, 600, 1000, 1500] as const;
export type MaxDistance = (typeof MAX_DISTANCES)[number];
const LONG_RANGE_ARCHETYPES = ["DMR", "Sniper"];

export interface SetupSelection {
  weapon: string | null;
  ammo: string | null;
}

export interface ResolvedSetup {
  weapon: PlayerWeapon;
  ammoOptions: readonly AmmoOption[];
  ammo: AmmoOption;
}

export interface SetupResult {
  setup: ResolvedSetup;
  projectile: BallisticProjectile | null;
  samples: readonly TrajectorySample[];
  rows: readonly RangeCardRow[];
}

function isFlatFireAmmo(option: AmmoOption): boolean {
  return option.projectile !== null && !option.projectile.propulsion && !option.projectile.explosive;
}

export function ballisticAmmoOptions(index: WeaponIndex, weapon: PlayerWeapon): AmmoOption[] {
  return index.ammoOptions(weapon).filter(isFlatFireAmmo);
}

export function ballisticWeapons(index: WeaponIndex): PlayerWeapon[] {
  return index.playerWeapons
    .filter((weapon) => (weapon.stats.muzzleVelocity ?? 0) > 0 && ballisticAmmoOptions(index, weapon).length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function defaultMaxDistance(weapon: PlayerWeapon | null): MaxDistance {
  const archetype = weapon?.archetype?.id;
  return archetype && LONG_RANGE_ARCHETYPES.some((id) => sameId(id, archetype)) ? 1000 : 600;
}

export function resolveSetup(index: WeaponIndex, selection: SetupSelection): ResolvedSetup | null {
  const weapons = ballisticWeapons(index);
  const weapon =
    weapons.find((candidate) => selection.weapon !== null && sameId(candidate.id, selection.weapon)) ?? weapons[0];
  if (!weapon) return null;
  const ammoOptions = ballisticAmmoOptions(index, weapon);
  const ammo =
    ammoOptions.find((option) => selection.ammo !== null && sameId(option.item.id, selection.ammo)) ?? ammoOptions[0];
  if (!ammo) return null;
  return { weapon, ammoOptions, ammo };
}

export function computeSetup(setup: ResolvedSetup, maxDistance: number, targetSpeed: number | null): SetupResult {
  const source = setup.ammo.projectile;
  const projectile = source ? ballisticProjectileOf(source) : null;
  const muzzleVelocity = setup.weapon.stats.muzzleVelocity ?? 0;
  if (!source || !projectile || muzzleVelocity <= 0) return { setup, projectile: null, samples: [], rows: [] };
  const samples = simulate(projectile, muzzleVelocity, 0, maxDistance);
  const rows = rangeCard({
    samples,
    massKg: projectile.massKg,
    baseDamage: source.damage,
    falloff: (distance) => falloffAt(setup.weapon.stats, distance),
    targetSpeed,
  });
  return { setup, projectile, samples, rows };
}
