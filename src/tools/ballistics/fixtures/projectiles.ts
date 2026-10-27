import type { Projectile } from "@/core/data";
import ammoJson from "@/test/fixtures/data/25937608/ammo.json";

export function fixtureProjectile(id: string): Projectile {
  const projectile = (ammoJson.projectiles as Projectile[]).find((candidate) => candidate.id === id);
  if (projectile === undefined) {
    throw new Error(`No fixture projectile ${id}`);
  }
  return projectile;
}
