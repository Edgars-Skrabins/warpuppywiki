import type { z } from "zod";
import { BuildsFile } from "./builds";
import { AmmoFile } from "./schemas/ammo";
import { AttachmentsFile } from "./schemas/attachments";
import { BuildablesFile } from "./schemas/buildables";
import { ChallengeRewardsFile } from "./schemas/challengeRewards";
import { CosmeticsFile } from "./schemas/cosmetics";
import { DamageFile } from "./schemas/damage";
import { EquipmentFile } from "./schemas/equipment";
import { ItemsFile } from "./schemas/items";
import { LootFile } from "./schemas/loot";
import { BuildingsFile, MapFile, ObjectivesFile, ObjectsFile, TerrainFile } from "./schemas/maps";
import { MetaFile } from "./schemas/meta";
import { MovementFile } from "./schemas/movement";
import { RewardsFile } from "./schemas/rewards";
import { RolesFile } from "./schemas/roles";
import { SkillsFile } from "./schemas/skills";
import { TagsFile } from "./schemas/tags";
import { VehicleConfigsFile } from "./schemas/vehicleConfigs";
import { VehiclesFile } from "./schemas/vehicles";
import { WeaponsFile } from "./schemas/weapons";

export const WORLDS = ["kavkazi", "europe", "north-america"] as const;

export type World = (typeof WORLDS)[number];

type FileEntry = { path: string; scope: "build" | "world"; schema: z.ZodType };

export const DATA_FILES = {
  items: { path: "items.json", scope: "build", schema: ItemsFile },
  weapons: { path: "weapons.json", scope: "build", schema: WeaponsFile },
  ammo: { path: "ammo.json", scope: "build", schema: AmmoFile },
  attachments: { path: "attachments.json", scope: "build", schema: AttachmentsFile },
  equipment: { path: "equipment.json", scope: "build", schema: EquipmentFile },
  damage: { path: "damage.json", scope: "build", schema: DamageFile },
  vehicles: { path: "vehicles.json", scope: "build", schema: VehiclesFile },
  vehicleConfigs: { path: "vehicle-configs.json", scope: "build", schema: VehicleConfigsFile },
  buildables: { path: "buildables.json", scope: "build", schema: BuildablesFile },
  loot: { path: "loot.json", scope: "build", schema: LootFile },
  movement: { path: "movement.json", scope: "build", schema: MovementFile },
  rewards: { path: "rewards.json", scope: "build", schema: RewardsFile },
  challengeRewards: { path: "challenge-rewards.json", scope: "build", schema: ChallengeRewardsFile },
  roles: { path: "roles.json", scope: "build", schema: RolesFile },
  skills: { path: "skills.json", scope: "build", schema: SkillsFile },
  tags: { path: "tags.json", scope: "build", schema: TagsFile },
  meta: { path: "meta.json", scope: "build", schema: MetaFile },
  cosmetics: { path: "cosmetics.json", scope: "build", schema: CosmeticsFile },
  map: { path: "map.json", scope: "world", schema: MapFile },
  terrain: { path: "terrain.json", scope: "world", schema: TerrainFile },
  buildings: { path: "buildings.json", scope: "world", schema: BuildingsFile },
  objectives: { path: "objectives.json", scope: "world", schema: ObjectivesFile },
  objects: { path: "objects.json", scope: "world", schema: ObjectsFile },
} as const satisfies Record<string, FileEntry>;

type DataFiles = typeof DATA_FILES;

export type DataFileKey = keyof DataFiles;

export type BuildFileKey = { [K in DataFileKey]: DataFiles[K]["scope"] extends "build" ? K : never }[DataFileKey];

export type WorldFileKey = { [K in DataFileKey]: DataFiles[K]["scope"] extends "world" ? K : never }[DataFileKey];

export type DataOf<K extends DataFileKey> = z.infer<DataFiles[K]["schema"]>;

export const BUILD_FILE_KEYS = (Object.keys(DATA_FILES) as DataFileKey[]).filter(
  (key): key is BuildFileKey => DATA_FILES[key].scope === "build",
);

export const WORLD_FILE_KEYS = (Object.keys(DATA_FILES) as DataFileKey[]).filter(
  (key): key is WorldFileKey => DATA_FILES[key].scope === "world",
);

export function buildFilePath(key: BuildFileKey): string {
  return DATA_FILES[key].path;
}

export function worldFilePath(world: World, key: WorldFileKey): string {
  return `maps/${world}/${DATA_FILES[key].path}`;
}

export function schemaForPath(path: string): z.ZodType | undefined {
  if (path === "builds.json") {
    return BuildsFile;
  }
  const relative = path.slice(path.indexOf("/") + 1);
  const worldMatch = /^maps\/[^/]+\/(.+)$/.exec(relative);
  const fileName = worldMatch ? worldMatch[1] : relative;
  const scope = worldMatch ? "world" : "build";
  const entry = Object.values(DATA_FILES).find((file) => file.scope === scope && file.path === fileName);
  return entry?.schema;
}
