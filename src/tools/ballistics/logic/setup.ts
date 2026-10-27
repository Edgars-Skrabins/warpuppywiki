import type { Attachment } from "@/core/data";
import { sameId } from "@/core/catalog";
import { effectiveStats, falloffAt, type AmmoOption, type PlayerWeapon, type WeaponIndex } from "@/core/weapons";
import { rangeCard, type RangeCardRow } from "./rangeCard";
import { ballisticProjectileOf, simulate, type BallisticProjectile, type TrajectorySample } from "./trajectory";
import { SIGHT_HEIGHT, solveLaunchAngle } from "./zero";

export const MAX_DISTANCES = [300, 600, 1000, 1500] as const;
export type MaxDistance = (typeof MAX_DISTANCES)[number];
export const DEFAULT_ZERO = 100;
export const DEFAULT_ZERO_STEP = 100;
const LONG_RANGE_ARCHETYPES = ["DMR", "Sniper"];

export interface SetupSelection {
  weapon: string | null;
  ammo: string | null;
  sight: string | null;
  zero: number | null;
}

export interface ResolvedSetup {
  weapon: PlayerWeapon;
  ammoOptions: readonly AmmoOption[];
  ammo: AmmoOption;
  sights: readonly Attachment[];
  sight: Attachment | null;
  zeroOptions: readonly number[];
  zero: number;
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

export function zeroOptions(index: WeaponIndex, weapon: PlayerWeapon, sight: Attachment | null): number[] {
  const zeroing = weapon.stats.zeroing;
  const fitted = [
    ...index.hiddenDefaults(weapon),
    ...(sight ? [{ slot: "Sight", attachment: sight, hiddenDefault: false }] : []),
  ];
  const stats = effectiveStats(weapon.stats, fitted);
  const rawMin = stats.zeroingMin?.value ?? null;
  const rawMax = stats.zeroingMax?.value ?? null;
  if (rawMin === null && rawMax === null) return [DEFAULT_ZERO];
  const max = rawMax ?? rawMin ?? DEFAULT_ZERO;
  const min = Math.min(rawMin ?? DEFAULT_ZERO, max);
  const step = zeroing?.step && zeroing.step > 0 ? zeroing.step : DEFAULT_ZERO_STEP;
  const options: number[] = [];
  for (let zero = min; zero <= max; zero += step) options.push(zero);
  return options;
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
  const hasSightSlot = weapon.visibleSlots.some((slot) => sameId(slot.slot, "Sight"));
  const sights = hasSightSlot ? index.slotOptions(weapon, "Sight") : [];
  const sight = sights.find((candidate) => selection.sight !== null && sameId(candidate.id, selection.sight)) ?? null;
  const zeros = zeroOptions(index, weapon, sight);
  const zero = zeros.find((candidate) => candidate === selection.zero) ?? zeros[0] ?? DEFAULT_ZERO;
  return { weapon, ammoOptions, ammo, sights, sight, zeroOptions: zeros, zero };
}

export function computeSetup(setup: ResolvedSetup, maxDistance: number): SetupResult {
  const source = setup.ammo.projectile;
  const projectile = source ? ballisticProjectileOf(source) : null;
  const muzzleVelocity = setup.weapon.stats.muzzleVelocity ?? 0;
  if (!source || !projectile || muzzleVelocity <= 0) return { setup, projectile: null, samples: [], rows: [] };
  const angle = solveLaunchAngle(projectile, muzzleVelocity, setup.zero, SIGHT_HEIGHT);
  const samples = simulate(projectile, muzzleVelocity, angle, maxDistance);
  const rows = rangeCard({
    samples,
    massKg: projectile.massKg,
    baseDamage: source.damage,
    falloff: (distance) => falloffAt(setup.weapon.stats, distance),
  });
  return { setup, projectile, samples, rows };
}
