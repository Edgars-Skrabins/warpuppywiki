import { WORLDS, type BuildFileKey, type World } from "@/core/data";
import { isRecord, valuesEqual } from "./deepDiff";
import { byDamageRule, byFields, byProjectile, normalizeKey, text, type KeyFunction } from "./keys";
import type { DiffOptions, DiffRecord } from "./types";

export type WorldFileKind = "objectives" | "objects" | "buildings";

export type FileRef =
  | { id: string; fileName: string; scope: "build"; key: BuildFileKey }
  | { id: string; fileName: string; scope: "world"; world: World; key: WorldFileKind };

export type BuildFiles = Readonly<Record<string, unknown>>;

export interface DiffContext {
  from: BuildFiles;
  to: BuildFiles;
}

export interface CollectionDefinition {
  group: string;
  file: string;
  select: (file: unknown) => DiffRecord[];
  key: KeyFunction;
  name: (record: DiffRecord) => string;
  filter?: (context: DiffContext) => (record: DiffRecord) => boolean;
  options?: Partial<DiffOptions>;
}

export interface CategoryDefinition {
  id: string;
  label: string;
  files: string[];
  collections: CollectionDefinition[];
  notes?: (context: DiffContext) => string[];
}

export const DEFAULT_DIFF_OPTIONS: DiffOptions = {
  ignore: ["asset", "gameBuild", "schemaVersion"],
  keyedArrays: {
    slots: "slot",
    vendor: "tag",
    damageFalloff: "distance",
    levels: "level",
    points: "input",
    items: "item",
  },
  setArrays: true,
  summarize: ["recoil.pattern"],
};

const BUILD_FILES: Record<string, string> = {
  items: "items.json",
  weapons: "weapons.json",
  ammo: "ammo.json",
  attachments: "attachments.json",
  equipment: "equipment.json",
  damage: "damage.json",
  vehicles: "vehicles.json",
  vehicleConfigs: "vehicle-configs.json",
  buildables: "buildables.json",
  loot: "loot.json",
  movement: "movement.json",
  rewards: "rewards.json",
  challengeRewards: "challenge-rewards.json",
  roles: "roles.json",
  skills: "skills.json",
  tags: "tags.json",
  meta: "meta.json",
  cosmetics: "cosmetics.json",
};

const WORLD_FILE_KINDS: readonly WorldFileKind[] = ["objectives", "objects", "buildings"];

const WORLD_LABELS: Record<World, string> = {
  kavkazi: "Kavkazi",
  europe: "Europe",
  "north-america": "North America",
};

export function worldFileId(world: World, kind: WorldFileKind): string {
  return `maps/${world}/${kind}`;
}

export const FILE_REFS: Readonly<Record<string, FileRef>> = Object.fromEntries([
  ...Object.entries(BUILD_FILES).map(([key, fileName]) => [
    key,
    { id: key, fileName, scope: "build", key: key as BuildFileKey },
  ]),
  ...WORLDS.flatMap((world) =>
    WORLD_FILE_KINDS.map((kind) => {
      const id = worldFileId(world, kind);
      return [id, { id, fileName: `maps/${world}/${kind}.json`, scope: "world", world, key: kind }];
    }),
  ),
]) as Record<string, FileRef>;

function records(field: string): (file: unknown) => DiffRecord[] {
  return (file) => {
    const value = isRecord(file) ? file[field] : undefined;
    return Array.isArray(value) ? value.filter(isRecord) : [];
  };
}

function list(value: unknown): string {
  return Array.isArray(value) ? value.map(text).join(", ") : "";
}

function nameOrId(record: DiffRecord): string {
  return text(record.name) || text(record.id);
}

function fieldName(field: string): (record: DiffRecord) => string {
  return (record) => text(record[field]);
}

function joined(...parts: string[]): string {
  return parts.filter((part) => part !== "").join(" · ");
}

function idsFrom(context: DiffContext, file: string, pick: (record: DiffRecord) => unknown[], field: string) {
  const ids = new Set<string>();
  for (const files of [context.from, context.to]) {
    for (const record of records(field)(files[file])) {
      for (const id of pick(record)) {
        if (typeof id === "string") {
          ids.add(normalizeKey(id));
        }
      }
    }
  }
  return ids;
}

const ownId = (record: DiffRecord): unknown[] => [record.id];

const weaponIds = (context: DiffContext) => idsFrom(context, "weapons", ownId, "weapons");
const attachmentIds = (context: DiffContext) => idsFrom(context, "attachments", ownId, "attachments");
const armorIds = (context: DiffContext) => idsFrom(context, "equipment", ownId, "armor");
const ammoItemIds = (context: DiffContext) =>
  idsFrom(context, "ammo", (record) => (Array.isArray(record.items) ? record.items : []), "projectiles");

function itemsIn(ids: (context: DiffContext) => Set<string>) {
  return (context: DiffContext) => {
    const set = ids(context);
    return (record: DiffRecord) => set.has(normalizeKey(text(record.id)));
  };
}

function itemsOutside(...idSets: ((context: DiffContext) => Set<string>)[]) {
  return (context: DiffContext) => {
    const sets = idSets.map((ids) => ids(context));
    return (record: DiffRecord) => !sets.some((set) => set.has(normalizeKey(text(record.id))));
  };
}

function itemCollection(group: string, filter: CollectionDefinition["filter"]): CollectionDefinition {
  return { group, file: "items", select: records("items"), key: byFields("id"), name: nameOrId, filter };
}

const META_FIELDS = new Set(["schemaVersion", "gameBuild", "units"]);

function sectionLabel(section: string): string {
  const words = section.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function movementSections(file: unknown): DiffRecord[] {
  if (!isRecord(file)) {
    return [];
  }
  return Object.entries(file)
    .filter(([section, value]) => !META_FIELDS.has(section) && !Array.isArray(value))
    .map(([section, value]) => (isRecord(value) ? { section, ...value } : { section, [section]: value }));
}

function withoutMeta(file: unknown): unknown {
  return isRecord(file) ? Object.fromEntries(Object.entries(file).filter(([key]) => !META_FIELDS.has(key))) : file;
}

function vehiclePhysicsNotes(context: DiffContext): string[] {
  const from = context.from.vehicleConfigs;
  const to = context.to.vehicleConfigs;
  if (from === undefined || to === undefined) {
    return [];
  }
  return valuesEqual(withoutMeta(from), withoutMeta(to)) ? [] : ["Vehicle physics files changed"];
}

function damageRuleName(record: DiffRecord): string {
  return joined(
    text(record.entity),
    text(record.category),
    text(record.operation),
    list(record.source),
    list(record.hitLocations),
  );
}

function worldCollections(world: World): CollectionDefinition[] {
  const label = WORLD_LABELS[world];
  return [
    {
      group: `${world}-objectives`,
      file: worldFileId(world, "objectives"),
      select: records("configs"),
      key: byFields("config"),
      name: (record) => joined(label, "Objective", text(record.config)),
    },
    {
      group: `${world}-objects`,
      file: worldFileId(world, "objects"),
      select: records("objects"),
      key: byFields("id"),
      name: (record) => joined(label, text(record.kind), text(record.id)),
    },
    {
      group: `${world}-buildings`,
      file: worldFileId(world, "buildings"),
      select: records("buildings"),
      key: byFields("id"),
      name: (record) => joined(label, "Building", text(record.kind), text(record.id)),
    },
  ];
}

export const CATEGORY_DEFINITIONS: readonly CategoryDefinition[] = [
  {
    id: "weapons",
    label: "Weapons",
    files: ["weapons", "items"],
    collections: [
      { group: "weapon", file: "weapons", select: records("weapons"), key: byFields("id"), name: nameOrId },
      itemCollection("weapon", itemsIn(weaponIds)),
    ],
  },
  {
    id: "ammo",
    label: "Ammunition",
    files: ["ammo", "items"],
    collections: [
      { group: "projectile", file: "ammo", select: records("projectiles"), key: byProjectile, name: nameOrId },
      itemCollection("ammo-item", itemsIn(ammoItemIds)),
    ],
  },
  {
    id: "attachments",
    label: "Attachments",
    files: ["attachments", "items"],
    collections: [
      {
        group: "attachment",
        file: "attachments",
        select: records("attachments"),
        key: byFields("id"),
        name: nameOrId,
      },
      itemCollection("attachment", itemsIn(attachmentIds)),
    ],
  },
  {
    id: "armor",
    label: "Armor and weight classes",
    files: ["equipment", "items"],
    collections: [
      { group: "armor", file: "equipment", select: records("armor"), key: byFields("id"), name: nameOrId },
      itemCollection("armor", itemsIn(armorIds)),
      {
        group: "weight-class",
        file: "equipment",
        select: records("weightClasses"),
        key: byFields("name"),
        name: (record) => joined("Weight class", text(record.name)),
      },
    ],
  },
  {
    id: "items",
    label: "Items",
    files: ["items", "weapons", "ammo", "attachments", "equipment"],
    collections: [itemCollection("item", itemsOutside(weaponIds, attachmentIds, armorIds, ammoItemIds))],
  },
  {
    id: "vehicles",
    label: "Vehicles",
    files: ["vehicles", "vehicleConfigs"],
    collections: [
      { group: "vehicle", file: "vehicles", select: records("vehicles"), key: byFields("id"), name: nameOrId },
    ],
    notes: vehiclePhysicsNotes,
  },
  {
    id: "damage",
    label: "Damage rules",
    files: ["damage"],
    collections: [
      { group: "rule", file: "damage", select: records("rules"), key: byDamageRule, name: damageRuleName },
      {
        group: "vehicle-seats",
        file: "damage",
        select: records("vehicleSeats"),
        key: byFields("vehicle"),
        name: (record) => joined("Vehicle seats", text(record.vehicle)),
      },
    ],
  },
  {
    id: "hit-locations",
    label: "Hit-location multipliers and ammo types",
    files: ["damage"],
    collections: [
      {
        group: "hit-locations",
        file: "damage",
        select: records("hitLocationMultipliers"),
        key: byFields("weaponClass"),
        name: (record) => joined("Hit locations", text(record.weaponClass)),
      },
      {
        group: "ammo-type",
        file: "damage",
        select: records("ammoTypes"),
        key: byFields("ammoType"),
        name: (record) => joined("Ammo type", text(record.ammoType)),
      },
    ],
  },
  {
    id: "buildables",
    label: "Buildables",
    files: ["buildables"],
    collections: [
      { group: "buildable", file: "buildables", select: records("buildables"), key: byFields("id"), name: nameOrId },
    ],
  },
  {
    id: "loot",
    label: "Loot tables",
    files: ["loot"],
    collections: [{ group: "loot", file: "loot", select: records("tables"), key: byFields("id"), name: nameOrId }],
  },
  {
    id: "roles",
    label: "Role levels",
    files: ["roles"],
    collections: [{ group: "role", file: "roles", select: records("roles"), key: byFields("id"), name: nameOrId }],
  },
  {
    id: "skills",
    label: "Skills",
    files: ["skills"],
    collections: [
      { group: "skill", file: "skills", select: records("skills"), key: byFields("id"), name: nameOrId },
      {
        group: "skill-tree",
        file: "skills",
        select: records("trees"),
        key: byFields("role"),
        name: (record) => joined("Skill tree", text(record.role)),
      },
    ],
  },
  {
    id: "cash-rewards",
    label: "Cash rewards",
    files: ["rewards"],
    collections: [
      {
        group: "reward",
        file: "rewards",
        select: records("rewards"),
        key: byFields("action", "context"),
        name: (record) => joined(text(record.action), text(record.context)),
      },
    ],
  },
  {
    id: "challenge-rewards",
    label: "Challenge rewards",
    files: ["challengeRewards"],
    collections: [
      {
        group: "challenge-event",
        file: "challengeRewards",
        select: records("events"),
        key: byFields("id"),
        name: nameOrId,
      },
      {
        group: "challenge-reward",
        file: "challengeRewards",
        select: records("rewards"),
        key: byFields("id"),
        name: fieldName("id"),
      },
      {
        group: "challenge-curve",
        file: "challengeRewards",
        select: records("curves"),
        key: byFields("id"),
        name: fieldName("id"),
      },
    ],
  },
  {
    id: "cosmetics",
    label: "Cosmetics and gold market",
    files: ["cosmetics", "meta"],
    collections: [
      {
        group: "cosmetic-set",
        file: "cosmetics",
        select: records("sets"),
        key: byFields("id"),
        name: (record) => joined("Set", nameOrId(record)),
      },
      { group: "cosmetic", file: "cosmetics", select: records("cosmetics"), key: byFields("id"), name: nameOrId },
      {
        group: "gold-market",
        file: "meta",
        select: records("goldMarket"),
        key: byFields("id"),
        name: (record) => joined("Gold market", text(record.id)),
      },
    ],
  },
  {
    id: "achievements",
    label: "Achievements and missions",
    files: ["meta"],
    collections: [
      { group: "achievement", file: "meta", select: records("achievements"), key: byFields("id"), name: nameOrId },
      {
        group: "mission",
        file: "meta",
        select: records("passiveMissions"),
        key: byFields("id"),
        name: (record) => joined("Mission", text(record.id)),
      },
    ],
  },
  {
    id: "tags",
    label: "Tags",
    files: ["tags"],
    collections: [
      { group: "tag", file: "tags", select: records("tags"), key: byFields("tag"), name: fieldName("tag") },
    ],
  },
  {
    id: "movement",
    label: "Movement",
    files: ["movement"],
    collections: [
      {
        group: "movement-section",
        file: "movement",
        select: movementSections,
        key: byFields("section"),
        name: (record) => sectionLabel(text(record.section)),
      },
      {
        group: "stance",
        file: "movement",
        select: records("stances"),
        key: byFields("name"),
        name: (record) => joined("Stance", text(record.name)),
      },
      {
        group: "stance-transition",
        file: "movement",
        select: records("stanceTransitions"),
        key: byFields("from", "to"),
        name: (record) => `Stance ${text(record.from)} → ${text(record.to)}`,
      },
    ],
  },
  {
    id: "maps",
    label: "Maps",
    files: WORLDS.flatMap((world) => WORLD_FILE_KINDS.map((kind) => worldFileId(world, kind))),
    collections: WORLDS.flatMap(worldCollections),
  },
];

export function categoryById(id: string): CategoryDefinition | undefined {
  return CATEGORY_DEFINITIONS.find((definition) => definition.id === id);
}
