import { z } from "zod";
import { WORLDS, type World } from "@/core/data";
import type { Vec2 } from "@/core/maps";
import { defineUrlState } from "@/core/state";
import { defaultLayers, LAYER_IDS, type LayerId } from "./layers/layerDefinitions";
import { BUILDING_KINDS, type BuildingKind } from "./logic/buildingStyle";
import { clearLosPoints, defaultLos, Los } from "./los/losState";
import { emptyPlans, Plans, type Plan } from "./plan/plan";

export const DEFAULT_WORLD: World = "kavkazi";

export const MapState = z.object({
  world: z.enum(WORLDS),
  center: z.tuple([z.number(), z.number()]).nullable(),
  zoom: z.number().nullable(),
  grid: z.boolean(),
  layers: z.record(z.enum(LAYER_IDS), z.boolean()),
  buildingKinds: z.record(z.enum(BUILDING_KINDS), z.boolean()),
  plans: Plans,
  los: Los,
});

export type MapState = z.infer<typeof MapState>;

export function defaultBuildingKinds(): Record<BuildingKind, boolean> {
  return Object.fromEntries(BUILDING_KINDS.map((kind) => [kind, true])) as Record<BuildingKind, boolean>;
}

export const mapStateCodec = defineUrlState<MapState>({
  key: "m",
  version: 4,
  schema: MapState,
  defaults: {
    world: DEFAULT_WORLD,
    center: null,
    zoom: null,
    grid: true,
    layers: defaultLayers(),
    buildingKinds: defaultBuildingKinds(),
    plans: emptyPlans(),
    los: defaultLos(),
  },
  migrate: {
    1: (old) => ({ ...(old as object), layers: defaultLayers(), buildingKinds: defaultBuildingKinds() }),
    2: (old) => ({ ...(old as object), plans: emptyPlans() }),
    3: (old) => ({ ...(old as object), los: defaultLos() }),
  },
});

export function withWorld(state: MapState, world: World): MapState {
  return world === state.world ? state : { ...state, world, center: null, zoom: null, los: clearLosPoints(state.los) };
}

export function withView(state: MapState, center: Vec2, zoom: number): MapState {
  return {
    ...state,
    center: [Math.round(center[0]), Math.round(center[1])],
    zoom: Math.round(zoom * 100) / 100,
  };
}

export function withLayer(state: MapState, id: LayerId, on: boolean): MapState {
  return { ...state, layers: { ...state.layers, [id]: on } };
}

export function withBuildingKind(state: MapState, kind: BuildingKind, on: boolean): MapState {
  return { ...state, buildingKinds: { ...state.buildingKinds, [kind]: on } };
}

export function withPlan(state: MapState, world: World, update: (plan: Plan) => Plan): MapState {
  return { ...state, plans: { ...state.plans, [world]: update(state.plans[world]) } };
}
