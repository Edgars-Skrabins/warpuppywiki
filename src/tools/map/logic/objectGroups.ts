import type { MapObject } from "@/core/data";
import { sameId } from "@/core/catalog";
import { LAYERS, type LayerId, type MapObjectKind } from "../layers/layerDefinitions";

export const FACTIONS = ["alpha", "bravo", "charlie", "neutral"] as const;

export type FactionKey = (typeof FACTIONS)[number];

export const FACTION_LABELS: Record<FactionKey, string> = {
  alpha: "Alpha",
  bravo: "Bravo",
  charlie: "Charlie",
  neutral: "Neutral",
};

export const OBJECT_KIND_LABELS: Record<MapObjectKind, string> = {
  "equipment-vendor": "Equipment vendor",
  "vehicle-vendor": "Vehicle vendor",
  "garage-vendor": "Garage vendor",
  "safe-zone": "Safe zone",
  "safe-zone-camera": "Safe zone camera",
  "spawn-manager": "Team spawn",
  "spawn-volume": "Spawn volume",
  "vehicle-deployment-board": "Vehicle deployment board",
  "fuel-refill": "Fuel refill",
};

export type ObjectGroups = Partial<Record<LayerId, MapObject[]>>;

export function factionKey(faction: string | null | undefined): FactionKey {
  if (faction === null || faction === undefined) {
    return "neutral";
  }
  return FACTIONS.find((key) => key !== "neutral" && sameId(key, faction.trim())) ?? "neutral";
}

export function factionLabel(faction: string | null | undefined): string {
  const key = factionKey(faction);
  if (key === "neutral" && faction !== null && faction !== undefined && faction.trim() !== "") {
    return faction;
  }
  return FACTION_LABELS[key];
}

export function groupObjects(objects: readonly MapObject[]): ObjectGroups {
  const groups: ObjectGroups = {};
  for (const definition of LAYERS) {
    if (definition.objectKinds.length === 0) {
      continue;
    }
    groups[definition.id] = objects.filter((object) => definition.objectKinds.includes(object.kind));
  }
  return groups;
}

export function headingDegrees(yaw: number | null | undefined): number | null {
  if (yaw === null || yaw === undefined || !Number.isFinite(yaw)) {
    return null;
  }
  return ((yaw % 360) + 360) % 360;
}
