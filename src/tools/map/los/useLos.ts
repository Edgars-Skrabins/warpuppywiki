import { useMemo } from "react";
import { useGameData, type Building, type DataState, type World } from "@/core/data";
import type { HeightFn, Heightmap } from "@/core/maps";
import { BUILDING_STYLES } from "../logic/buildingStyle";
import { runLos, type LosBox, type LosResult } from "./losModel";
import { stanceEyeHeights, targetHeightMeters, type Los, type Stance } from "./losState";
import { useViewshed, type ViewshedState } from "./useViewshed";
import { VIEWSHED_CELL_SIZE, type ViewshedInput } from "./viewshed";

export interface LosData {
  available: boolean;
  missing: boolean;
  eyes: Record<Stance, number | null>;
  observerGround: number | null;
  result: LosResult | null;
  viewshed: ViewshedState;
}

export function useLos(
  world: World,
  los: Los,
  heightmap: DataState<Heightmap | null>,
  buildings: readonly Building[],
): LosData {
  const movement = useGameData("movement");
  const movementData = movement.status === "success" ? movement.data : null;
  const eyes = useMemo(() => stanceEyeHeights(movementData), [movementData]);
  const heightData = heightmap.status === "success" ? heightmap.data : null;
  const heightAt = useMemo<HeightFn | null>(
    () => (heightData === null ? null : (x, y) => heightData.heightAt(x, y)),
    [heightData],
  );
  const boxes = useMemo<LosBox[]>(
    () =>
      buildings.map((building) => ({
        id: building.id,
        label: BUILDING_STYLES[building.kind].label,
        min: building.min,
        max: building.max,
      })),
    [buildings],
  );
  const eye = eyes[los.stance];
  const targetHeight = targetHeightMeters(los, eyes);
  const result = useMemo(() => {
    if (heightAt === null || los.observer === null || los.target === null || eye === null || targetHeight === null) {
      return null;
    }
    return runLos(
      {
        observer: los.observer,
        target: los.target,
        eyeHeight: eye,
        targetHeight,
        includeBuildings: los.buildings,
        path: los.path,
        apex: los.apex,
      },
      heightAt,
      boxes,
    );
  }, [heightAt, boxes, los.observer, los.target, eye, targetHeight, los.buildings, los.path, los.apex]);

  const viewshedObserver = los.tool === "viewshed" ? los.viewshed.observer : null;
  const [vx, vy] = viewshedObserver ?? [null, null];
  const standingHeight = eyes.stand;
  const viewshedInput = useMemo<ViewshedInput | null>(
    () =>
      vx === null || vy === null || heightAt === null || eye === null || standingHeight === null
        ? null
        : {
            observer: [vx, vy],
            radius: los.viewshed.radius,
            cellSize: VIEWSHED_CELL_SIZE,
            eyeHeight: eye,
            targetHeight: standingHeight,
            buildings: los.buildings ? boxes.map(({ min, max }) => ({ min, max })) : [],
          },
    [vx, vy, heightAt, eye, standingHeight, los.viewshed.radius, los.buildings, boxes],
  );
  const viewshed = useViewshed(world, viewshedInput);

  const observerPoint = los.tool === "viewshed" ? los.viewshed.observer : los.observer;
  return {
    available: heightData !== null,
    missing: heightmap.status !== "loading" && heightData === null,
    eyes,
    observerGround: heightAt !== null && observerPoint !== null ? heightAt(observerPoint[0], observerPoint[1]) : null,
    result,
    viewshed,
  };
}
