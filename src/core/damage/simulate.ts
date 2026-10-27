import { sameId } from "@/core/catalog";
import type { PlayerWeapon } from "@/core/weapons";
import { hitDamage } from "./hitDamage";
import type { DistancePoint, HitResult, KillResult, Scenario, ShotResult, Target } from "./types";

export const DEFAULT_HEALTH = 100;
export const DEFAULT_PELLETS_PER_SHOT = 6;
export const SHOT_CAP = 200;

const KILL_THRESHOLD = 1e-9;
const SHOTGUN_CLASS = "Weapon.Shotgun";

export function hitsPerShot(scenario: Pick<Scenario, "weapon" | "ammo" | "pelletsPerShot">): number {
  const firesPellets = sameId(scenario.weapon.damageClass, SHOTGUN_CLASS) && scenario.ammo.ammoType !== "Slug";
  return firesPellets ? (scenario.pelletsPerShot ?? DEFAULT_PELLETS_PER_SHOT) : 1;
}

export function timeToKill(weapon: PlayerWeapon, stk: number): number | null {
  const rpm = weapon.stats.rpm;
  if (!rpm) {
    return null;
  }
  return (weapon.stats.windupTime ?? 0) + ((stk - 1) * 60) / rpm;
}

function afterHit(target: Target, hit: HitResult): Target {
  const health = Math.max(0, target.health - hit.healthDamage);
  if (hit.armorPiece === "body" && target.body) {
    return {
      ...target,
      health,
      body: { ...target.body, durability: Math.max(0, target.body.durability - hit.armorDamage) },
    };
  }
  if (hit.armorPiece === "helmet" && target.helmet) {
    return {
      ...target,
      health,
      helmet: { ...target.helmet, durability: Math.max(0, target.helmet.durability - hit.armorDamage) },
    };
  }
  return { ...target, health };
}

export function simulateKill(scenario: Scenario): KillResult {
  const projectile = scenario.ammo.projectile;
  if (projectile === null) {
    return { supported: false, reason: "no-projectile" };
  }
  if (projectile.explosive) {
    return { supported: false, reason: "explosive" };
  }
  const pellets = hitsPerShot(scenario);
  const shots: ShotResult[] = [];
  let target = scenario.target;
  for (let shot = 1; shot <= SHOT_CAP; shot++) {
    const location = scenario.pattern[(shot - 1) % scenario.pattern.length];
    if (location === undefined) {
      break;
    }
    const hits: HitResult[] = [];
    for (let pellet = 0; pellet < pellets; pellet++) {
      const hit = hitDamage({ ...scenario, location, target });
      hits.push(hit);
      target = afterHit(target, hit);
    }
    shots.push({
      shot,
      location,
      hits,
      healthAfter: target.health,
      bodyDurabilityAfter: target.body?.durability ?? null,
      helmetDurabilityAfter: target.helmet?.durability ?? null,
    });
    if (target.health <= KILL_THRESHOLD) {
      const capacity = scenario.magazineCapacity ?? null;
      const needsReload = capacity !== null && shot > capacity;
      return {
        supported: true,
        killed: true,
        stk: shot,
        ttk: needsReload ? null : timeToKill(scenario.weapon, shot),
        needsReload,
        shots,
      };
    }
  }
  return { supported: true, killed: false, stk: null, ttk: null, needsReload: false, shots };
}

export function stkByDistance(scenario: Scenario, distances: readonly number[]): DistancePoint[] {
  return distances.map((distance) => {
    const result = simulateKill({ ...scenario, distance });
    return result.supported
      ? { distance, stk: result.stk, ttk: result.ttk, needsReload: result.needsReload }
      : { distance, stk: null, ttk: null, needsReload: false };
  });
}
