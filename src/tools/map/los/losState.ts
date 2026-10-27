import { z } from "zod";
import type { MovementFile } from "@/core/data";
import { sameId } from "@/core/catalog";
import type { Vec2 } from "@/core/maps";
import { Position, roundPosition } from "../plan/plan";
import { VIEWSHED_RADII } from "./viewshed";

export const STANCES = ["stand", "crouch", "prone"] as const;
export type Stance = (typeof STANCES)[number];

export const STANCE_LABELS: Record<Stance, string> = { stand: "Stand", crouch: "Crouch", prone: "Prone" };

export const TARGET_HEIGHTS = ["ground", "crouch", "stand", "custom"] as const;
export type TargetHeight = (typeof TARGET_HEIGHTS)[number];

export const TARGET_HEIGHT_LABELS: Record<TargetHeight, string> = {
  ground: "Ground",
  crouch: "Crouching person",
  stand: "Standing person",
  custom: "Custom height",
};

export const CUSTOM_HEIGHT_LIMITS = { min: 0, max: 50 } as const;
export const APEX_LIMITS = { min: 50, max: 2000 } as const;
export const DEFAULT_APEX = 300;
export const DEFAULT_VIEWSHED_RADIUS = 500;
export const EXTRA_LOS_NOTES = ["Vegetation is not modeled."];

export const Los = z.object({
  tool: z.enum(["line", "viewshed"]),
  observer: Position.nullable(),
  target: Position.nullable(),
  stance: z.enum(STANCES),
  targetHeight: z.enum(TARGET_HEIGHTS),
  customHeight: z.number().min(CUSTOM_HEIGHT_LIMITS.min).max(CUSTOM_HEIGHT_LIMITS.max),
  buildings: z.boolean(),
  path: z.enum(["direct", "indirect"]),
  apex: z.number().min(APEX_LIMITS.min).max(APEX_LIMITS.max),
  viewshed: z.object({
    observer: Position.nullable(),
    radius: z.union(VIEWSHED_RADII.map((radius) => z.literal(radius))),
  }),
});

export type Los = z.infer<typeof Los>;
export type ViewshedRadius = Los["viewshed"]["radius"];

export function defaultLos(): Los {
  return {
    tool: "line",
    observer: null,
    target: null,
    stance: "stand",
    targetHeight: "stand",
    customHeight: 2,
    buildings: true,
    path: "direct",
    apex: DEFAULT_APEX,
    viewshed: { observer: null, radius: DEFAULT_VIEWSHED_RADIUS },
  };
}

export function clearLosPoints(los: Los): Los {
  return { ...los, observer: null, target: null, viewshed: { ...los.viewshed, observer: null } };
}

export function stanceEyeHeights(movement: MovementFile | null | undefined): Record<Stance, number | null> {
  const heights = { stand: null, crouch: null, prone: null } as Record<Stance, number | null>;
  for (const stance of STANCES) {
    const found = movement?.stances.find((entry) => sameId(entry.name, STANCE_LABELS[stance]));
    if (found !== undefined && Number.isFinite(found.eyeHeight) && found.eyeHeight >= 0) {
      heights[stance] = found.eyeHeight;
    }
  }
  return heights;
}

export function targetHeightMeters(los: Los, eyes: Record<Stance, number | null>): number | null {
  switch (los.targetHeight) {
    case "ground":
      return 0;
    case "crouch":
      return eyes.crouch;
    case "stand":
      return eyes.stand;
    case "custom":
      return los.customHeight;
  }
}

export function losClick(los: Los, point: Vec2): Los {
  const rounded = roundPosition(point);
  if (los.tool === "viewshed") {
    return { ...los, viewshed: { ...los.viewshed, observer: rounded } };
  }
  if (los.observer === null || los.target !== null) {
    return { ...los, observer: rounded, target: null };
  }
  return { ...los, target: rounded };
}

export function losHint(los: Los): string {
  if (los.tool === "viewshed") {
    return "Click to set the observer.";
  }
  if (los.observer === null) {
    return "Click to set the observer.";
  }
  if (los.target === null) {
    return "Click to set the target.";
  }
  return "Drag the markers, or click to start again.";
}

export const NOT_IN_GAME_DATA = "Not in game data";

export function losDataGap(los: Los, eyes: Record<Stance, number | null>): string | null {
  if (eyes[los.stance] === null) {
    return `${STANCE_LABELS[los.stance]} eye height: ${NOT_IN_GAME_DATA}.`;
  }
  if (los.tool === "viewshed" && eyes.stand === null) {
    return `Standing eye height for the viewshed target: ${NOT_IN_GAME_DATA}.`;
  }
  if (los.tool === "line" && targetHeightMeters(los, eyes) === null) {
    return `${TARGET_HEIGHT_LABELS[los.targetHeight]} height: ${NOT_IN_GAME_DATA}.`;
  }
  return null;
}
