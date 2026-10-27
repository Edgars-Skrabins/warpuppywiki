import { useMemo } from "react";
import { useWorldData, type Building, type ObjectiveConfig, type World } from "@/core/data";
import { buildingCounts, isDrawable, type BuildingKind } from "../logic/buildingStyle";
import { groupObjects, type ObjectGroups } from "../logic/objectGroups";
import { findConfig, SNIPER_SHOWDOWN_MODE, STANDARD_MODE, zonePlacements } from "../logic/zoneChances";
import type { LayerId } from "./layerDefinitions";

export interface LayerData {
  standard: ObjectiveConfig | null;
  sniperShowdown: ObjectiveConfig | null;
  objects: ObjectGroups;
  buildings: readonly Building[];
  buildingCounts: Record<BuildingKind, number>;
  counts: Partial<Record<LayerId, number | null>>;
}

export function useLayerData(world: World): LayerData {
  const objectives = useWorldData(world, "objectives");
  const objects = useWorldData(world, "objects");
  const buildings = useWorldData(world, "buildings");
  const objectivesFile = objectives.status === "success" ? objectives.data : undefined;
  const objectsFile = objects.status === "success" ? objects.data : undefined;
  const buildingsFile = buildings.status === "success" ? buildings.data : undefined;
  const objectivesLoading = objectives.status === "loading";
  const objectsLoading = objects.status === "loading";
  const buildingsLoading = buildings.status === "loading";

  return useMemo(() => {
    const standard = findConfig(objectivesFile, STANDARD_MODE);
    const sniperShowdown = findConfig(objectivesFile, SNIPER_SHOWDOWN_MODE);
    const groups = groupObjects(objectsFile?.objects ?? []);
    const drawable = (buildingsFile?.buildings ?? []).filter(isDrawable);
    const counts: Partial<Record<LayerId, number | null>> = {
      objectives: objectivesLoading ? null : standard === null ? 0 : zonePlacements(standard).length,
      sniperShowdown: objectivesLoading ? null : sniperShowdown === null ? 0 : zonePlacements(sniperShowdown).length,
      buildings: buildingsLoading ? null : drawable.length,
    };
    for (const [id, list] of Object.entries(groups) as [LayerId, unknown[]][]) {
      counts[id] = objectsLoading ? null : list.length;
    }
    return {
      standard,
      sniperShowdown,
      objects: groups,
      buildings: drawable,
      buildingCounts: buildingCounts(drawable),
      counts,
    };
  }, [objectivesFile, objectsFile, buildingsFile, objectivesLoading, objectsLoading, buildingsLoading]);
}
