import { describe, expect, it } from "vitest";
import { decodeState, encodeState } from "@/core/state";
import { defaultLayers } from "./layers/layerDefinitions";
import {
  defaultBuildingKinds,
  mapStateCodec,
  withBuildingKind,
  withLayer,
  withView,
  withWorld,
  type MapState,
} from "./state";

const layers = defaultLayers();
const buildingKinds = defaultBuildingKinds();
const view: MapState = { world: "europe", center: [-8123, -12001], zoom: 4.5, grid: false, layers, buildingKinds };

describe("mapStateCodec", () => {
  it("defaults to Bakurani with the grid on and the whole map in view", () => {
    expect(mapStateCodec.defaults).toMatchObject({ world: "kavkazi", center: null, zoom: null, grid: true });
  });

  it("starts with objectives, shops, spawns and vehicles on, and spawn volumes, Sniper Showdown and buildings off", () => {
    expect(mapStateCodec.defaults.layers).toEqual({
      objectives: true,
      sniperShowdown: false,
      equipmentVendors: true,
      vehicleVendors: true,
      garageVendors: true,
      spawns: true,
      spawnVolumes: false,
      deploymentBoards: true,
      fuelRefills: true,
      buildings: false,
    });
    expect(Object.values(mapStateCodec.defaults.buildingKinds).every(Boolean)).toBe(true);
  });

  it("decodes a map link from before layers existed with the default layers", () => {
    const old = { world: "europe", center: [-8123, -12001], zoom: 4.5, grid: false };
    const text = encodeState({ ...mapStateCodec, version: 1 } as never, old);
    expect(decodeState(mapStateCodec, text)).toEqual({ state: view, error: false });
  });

  it("round-trips layer toggles through the URL", () => {
    const toggled = withBuildingKind(withLayer(view, "buildings", true), "garage", false);
    expect(decodeState(mapStateCodec, encodeState(mapStateCodec, toggled)).state).toEqual(toggled);
    expect(toggled.layers.buildings).toBe(true);
    expect(toggled.buildingKinds.garage).toBe(false);
  });

  it("round-trips a view through the URL", () => {
    expect(decodeState(mapStateCodec, encodeState(mapStateCodec, view))).toEqual({ state: view, error: false });
  });

  it("falls back to the defaults for an unknown world", () => {
    const text = encodeState(mapStateCodec, { ...view, world: "moon" } as unknown as MapState);
    expect(decodeState(mapStateCodec, text)).toEqual({ state: mapStateCodec.defaults, error: true });
  });
});

describe("withWorld", () => {
  it("resets the view when the world changes and keeps the grid and layer settings", () => {
    expect(withWorld(view, "kavkazi")).toEqual({ ...view, world: "kavkazi", center: null, zoom: null });
  });

  it("keeps the state when the world is the same", () => {
    expect(withWorld(view, "europe")).toBe(view);
  });
});

describe("withView", () => {
  it("rounds the centre to whole meters and the zoom to two decimals", () => {
    expect(withView(view, [-100.4, 250.6], 5.12345)).toEqual({ ...view, center: [-100, 251], zoom: 5.12 });
  });
});
