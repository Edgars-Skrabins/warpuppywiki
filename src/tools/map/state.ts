import { z } from "zod";
import { WORLDS, type World } from "@/core/data";
import type { Vec2 } from "@/core/maps";
import { defineUrlState } from "@/core/state";

export const DEFAULT_WORLD: World = "kavkazi";

export const MapState = z.object({
  world: z.enum(WORLDS),
  center: z.tuple([z.number(), z.number()]).nullable(),
  zoom: z.number().nullable(),
  grid: z.boolean(),
});

export type MapState = z.infer<typeof MapState>;

export const mapStateCodec = defineUrlState<MapState>({
  key: "m",
  version: 1,
  schema: MapState,
  defaults: { world: DEFAULT_WORLD, center: null, zoom: null, grid: true },
});

export function withWorld(state: MapState, world: World): MapState {
  return world === state.world ? state : { ...state, world, center: null, zoom: null };
}

export function withView(state: MapState, center: Vec2, zoom: number): MapState {
  return {
    ...state,
    center: [Math.round(center[0]), Math.round(center[1])],
    zoom: Math.round(zoom * 100) / 100,
  };
}
