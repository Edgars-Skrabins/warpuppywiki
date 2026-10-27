import { sameId, type Catalog } from "@/core/catalog";
import { HIT_LOCATIONS, hitPattern, type HitLocation, type Scenario, type WornPiece } from "@/core/damage";
import type { Armor, DamageFile, EquipmentFile } from "@/core/data";
import type { AmmoOption, MagazineOption, PlayerWeapon, WeaponIndex } from "@/core/weapons";
import type { MatchupState } from "../state";

export interface MatchupSources {
  index: WeaponIndex;
  damage: DamageFile;
  equipment: EquipmentFile;
  catalog: Catalog;
}

export interface ArmorOptions {
  body: readonly Armor[];
  helmets: readonly Armor[];
}

export interface ResolvedMatchup {
  weapon: PlayerWeapon;
  ammoOptions: readonly AmmoOption[];
  ammo: AmmoOption | null;
  magazines: readonly MagazineOption[];
  magazine: MagazineOption | null;
  isShotgun: boolean;
  pattern: readonly HitLocation[];
  bodyArmor: Armor | null;
  helmet: Armor | null;
}

export type ScenarioError = "unknown-weapon" | "no-ammo" | "no-zones";

export type ScenarioResult =
  | { ok: true; scenario: Scenario; matchup: ResolvedMatchup }
  | { ok: false; error: "unknown-weapon"; matchup: null }
  | { ok: false; error: "no-ammo" | "no-zones"; matchup: ResolvedMatchup };

const DEFAULT_ARCHETYPE = "AR";
const MAGAZINE_SLOT = "Magazine";
const SHOTGUN_CLASS = "Weapon.Shotgun";

function byName<T extends { name: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name, "en-US", { numeric: true, sensitivity: "base" });
}

function armorName(armor: Armor): string {
  return armor.name ?? armor.id;
}

export function defaultWeapon(index: WeaponIndex): PlayerWeapon | undefined {
  const sorted = [...index.playerWeapons].sort(byName);
  return (
    sorted.find((weapon) => weapon.archetype !== null && sameId(weapon.archetype.id, DEFAULT_ARCHETYPE)) ?? sorted[0]
  );
}

export function defaultMagazine(weapon: PlayerWeapon, options: readonly MagazineOption[]): MagazineOption | null {
  const slot = weapon.stats.slots.find((candidate) => sameId(candidate.slot, MAGAZINE_SLOT));
  const preferred = [...(slot?.default ? [slot.default] : []), ...(slot?.items ?? [])];
  return (
    preferred
      .map((id) => options.find((option) => sameId(option.attachment.id, id)))
      .find((option) => option !== undefined) ??
    options[0] ??
    null
  );
}

export function armorOptions(equipment: EquipmentFile, catalog: Catalog): ArmorOptions {
  const offered = equipment.armor
    .filter((armor) => {
      const item = catalog.item(armor.id);
      return item !== undefined && catalog.isPlayerItem(item);
    })
    .sort(
      (a, b) =>
        Number(a.coveredLocations.length === 0) - Number(b.coveredLocations.length === 0) ||
        armorName(a).localeCompare(armorName(b), "en-US", { numeric: true }),
    );
  return {
    body: offered.filter((armor) => sameId(armor.slot, "Armor")),
    helmets: offered.filter((armor) => sameId(armor.slot, "Helmet")),
  };
}

function findArmor(options: readonly Armor[], id: string | null): Armor | null {
  return id === null ? null : (options.find((armor) => sameId(armor.id, id)) ?? null);
}

function isHitLocation(zone: string): zone is HitLocation {
  return HIT_LOCATIONS.some((info) => info.location === zone);
}

function patternOf(state: MatchupState): readonly HitLocation[] {
  return state.placement === "custom" ? state.custom.filter(isHitLocation) : hitPattern(state.placement).locations;
}

function covers(armor: Armor | null): armor is Armor {
  return armor !== null && armor.coveredLocations.length > 0;
}

function wornPiece(armor: Armor | null, condition: number): WornPiece | null {
  return covers(armor) ? { armor, durability: (armor.durability ?? 0) * condition } : null;
}

export function resolveMatchup(state: MatchupState, sources: MatchupSources): ResolvedMatchup | null {
  const { index } = sources;
  const weapon = state.weaponId === "" ? defaultWeapon(index) : index.weapon(state.weaponId);
  if (weapon === undefined) {
    return null;
  }
  const ammoOptions = index.ammoOptions(weapon);
  const magazines = index.magazineOptions(weapon);
  const armor = armorOptions(sources.equipment, sources.catalog);
  return {
    weapon,
    ammoOptions,
    ammo: ammoOptions.find((option) => sameId(option.ammoType, state.ammoType)) ?? ammoOptions[0] ?? null,
    magazines,
    magazine:
      (state.magazineId === null
        ? undefined
        : magazines.find((option) => sameId(option.attachment.id, state.magazineId ?? ""))) ??
      defaultMagazine(weapon, magazines),
    isShotgun: sameId(weapon.damageClass, SHOTGUN_CLASS),
    pattern: patternOf(state),
    bodyArmor: findArmor(armor.body, state.bodyArmorId),
    helmet: findArmor(armor.helmets, state.helmetId),
  };
}

export function buildScenario(state: MatchupState, sources: MatchupSources): ScenarioResult {
  const matchup = resolveMatchup(state, sources);
  if (matchup === null) {
    return { ok: false, error: "unknown-weapon", matchup: null };
  }
  if (matchup.ammo === null) {
    return { ok: false, error: "no-ammo", matchup };
  }
  if (matchup.pattern.length === 0) {
    return { ok: false, error: "no-zones", matchup };
  }
  const scenario: Scenario = {
    damage: sources.damage,
    weapon: matchup.weapon,
    ammo: matchup.ammo,
    distance: state.distance,
    pattern: matchup.pattern,
    target: {
      health: state.health,
      body: wornPiece(matchup.bodyArmor, state.condition),
      helmet: wornPiece(matchup.helmet, state.condition),
      extras: [matchup.bodyArmor, matchup.helmet].filter((armor): armor is Armor => armor !== null && !covers(armor)),
    },
    ...(matchup.isShotgun ? { pelletsPerShot: state.pellets } : {}),
    magazineCapacity: matchup.magazine?.capacity ?? null,
  };
  return { ok: true, scenario, matchup };
}
