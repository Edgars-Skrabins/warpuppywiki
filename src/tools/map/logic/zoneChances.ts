import type { ObjectiveConfig, ObjectivesFile, ObjectiveZone } from "@/core/data";
import { sameId } from "@/core/catalog";
import { formatPercent } from "@/ui";

export const STANDARD_MODE = "Standard";
export const SNIPER_SHOWDOWN_MODE = "SniperShowdown";

export interface ZonePlacement {
  id: string;
  zone: ObjectiveZone;
  weight: number | null;
  chance: number | null;
  never: boolean;
  isDefault: boolean;
}

function usableWeight(weight: number): number {
  return Number.isFinite(weight) && weight > 0 ? weight : 0;
}

export function findConfig(file: ObjectivesFile | null | undefined, mode: string): ObjectiveConfig | null {
  return file?.configs.find((config) => sameId(config.mode, mode)) ?? null;
}

export function zonePlacements(config: ObjectiveConfig): ZonePlacement[] {
  if (config.alternatives.length === 0) {
    return [{ id: "Default", zone: config.zone, weight: null, chance: 1, never: false, isDefault: true }];
  }
  const total = config.alternatives.reduce((sum, alternative) => sum + usableWeight(alternative.weight), 0);
  return config.alternatives.map((alternative) => {
    const weight = usableWeight(alternative.weight);
    return {
      id: alternative.id,
      zone: alternative.zone,
      weight: alternative.weight,
      chance: total > 0 ? weight / total : null,
      never: total > 0 && weight === 0,
      isDefault: false,
    };
  });
}

export function chanceLabel(placement: ZonePlacement): string {
  if (placement.never) {
    return "Never chosen";
  }
  return placement.chance === null ? "Chance unknown" : formatPercent(placement.chance);
}

export function placementName(id: string): string {
  const parts = id.split(".").filter((part) => part !== "");
  if (parts.length >= 2 && sameId(parts[parts.length - 1] ?? "", "Circle")) {
    parts.pop();
  }
  return parts.at(-1) ?? id;
}
