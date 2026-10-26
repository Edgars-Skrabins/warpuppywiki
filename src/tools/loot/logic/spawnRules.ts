import type { LootTable } from "@/core/data";
import { formatNumber, formatSeconds } from "@/ui/format";
import { formatChance, tableSpawnChance } from "./lootChances";

export function spawnRules(table: LootTable): string[] {
  const chance = tableSpawnChance(table);
  const rules = [chance >= 1 ? "Always spawns" : `Spawns ${formatChance(chance)} of the time`];
  if (table.spawnInsideControlZoneOnly) {
    rules.push("Only inside the control zone");
  }
  if (table.initialSpawnTime !== null && table.initialSpawnTime !== undefined) {
    rules.push(`First spawn after ${formatSeconds(table.initialSpawnTime)}`);
  }
  if (table.spawnByPoints) {
    const points = table.initialSpawnPoints;
    rules.push(
      points === null || points === undefined
        ? "Paced by spawn points"
        : `Paced by spawn points (starts with ${formatNumber(points)})`,
    );
  }
  if (!table.canRespawn) {
    rules.push("Does not respawn");
  } else if (table.respawnTime === null || table.respawnTime === undefined) {
    rules.push("Respawns");
  } else {
    rules.push(`Respawns after ${formatSeconds(table.respawnTime)}`);
  }
  if (table.neverSelectPreviousItem) {
    rules.push("Never repeats the previous item");
  }
  return rules;
}
