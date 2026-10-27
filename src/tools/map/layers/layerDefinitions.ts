import type { MapObject } from "@/core/data";
import type { IconName } from "@/ui";

export type MapObjectKind = MapObject["kind"];

export const LAYER_IDS = [
  "objectives",
  "sniperShowdown",
  "equipmentVendors",
  "vehicleVendors",
  "garageVendors",
  "spawns",
  "spawnVolumes",
  "deploymentBoards",
  "fuelRefills",
  "buildings",
] as const;

export type LayerId = (typeof LAYER_IDS)[number];

export const LAYER_GROUPS = ["objectives", "shops", "spawns", "vehicles", "buildings"] as const;

export type LayerGroupId = (typeof LAYER_GROUPS)[number];

export const LAYER_GROUP_LABELS: Record<LayerGroupId, string> = {
  objectives: "Objectives",
  shops: "Shops",
  spawns: "Spawns",
  vehicles: "Vehicles",
  buildings: "Buildings",
};

export type LayerSwatch = "zone" | "icon" | "volume" | "building";

export interface LayerDefinition {
  id: LayerId;
  label: string;
  group: LayerGroupId;
  defaultOn: boolean;
  parent: LayerId | null;
  swatch: LayerSwatch;
  color: string;
  icon: IconName | null;
  objectKinds: readonly MapObjectKind[];
  minZoom: number | null;
}

function layer(
  definition: Partial<LayerDefinition> & Pick<LayerDefinition, "id" | "label" | "group">,
): LayerDefinition {
  return {
    defaultOn: true,
    parent: null,
    swatch: "icon",
    color: "--faction-neutral",
    icon: null,
    objectKinds: [],
    minZoom: null,
    ...definition,
  };
}

export const BUILDINGS_MIN_ZOOM = 3;

export const LAYERS: readonly LayerDefinition[] = [
  layer({ id: "objectives", label: "Control zones", group: "objectives", swatch: "zone", color: "--color-accent" }),
  layer({
    id: "sniperShowdown",
    label: "Sniper Showdown",
    group: "objectives",
    defaultOn: false,
    parent: "objectives",
    swatch: "zone",
    color: "--color-text",
  }),
  layer({
    id: "equipmentVendors",
    label: "Equipment vendors",
    group: "shops",
    icon: "store",
    objectKinds: ["equipment-vendor"],
  }),
  layer({
    id: "vehicleVendors",
    label: "Vehicle vendors",
    group: "shops",
    icon: "truck",
    objectKinds: ["vehicle-vendor"],
  }),
  layer({
    id: "garageVendors",
    label: "Garage vendors",
    group: "shops",
    icon: "garage",
    objectKinds: ["garage-vendor"],
  }),
  layer({
    id: "spawns",
    label: "Safe zones and spawns",
    group: "spawns",
    icon: "tent",
    objectKinds: ["safe-zone", "spawn-manager"],
  }),
  layer({
    id: "spawnVolumes",
    label: "Spawn volumes",
    group: "spawns",
    defaultOn: false,
    swatch: "volume",
    objectKinds: ["spawn-volume"],
  }),
  layer({
    id: "deploymentBoards",
    label: "Deployment boards",
    group: "vehicles",
    icon: "list",
    objectKinds: ["vehicle-deployment-board"],
  }),
  layer({ id: "fuelRefills", label: "Fuel refills", group: "vehicles", icon: "fuel", objectKinds: ["fuel-refill"] }),
  layer({
    id: "buildings",
    label: "Buildings",
    group: "buildings",
    defaultOn: false,
    swatch: "building",
    color: "--color-text-muted",
    minZoom: BUILDINGS_MIN_ZOOM,
  }),
];

export const OBJECT_ICONS: Partial<Record<MapObjectKind, IconName>> = {
  "equipment-vendor": "store",
  "vehicle-vendor": "truck",
  "garage-vendor": "garage",
  "safe-zone": "tent",
  "spawn-manager": "flag",
  "vehicle-deployment-board": "list",
  "fuel-refill": "fuel",
};

export function layerDefinition(id: LayerId): LayerDefinition {
  const definition = LAYERS.find((entry) => entry.id === id);
  if (definition === undefined) {
    throw new Error(`Unknown map layer ${id}`);
  }
  return definition;
}

export function defaultLayers(): Record<LayerId, boolean> {
  return Object.fromEntries(LAYERS.map((definition) => [definition.id, definition.defaultOn])) as Record<
    LayerId,
    boolean
  >;
}
