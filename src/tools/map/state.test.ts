import { describe, expect, it } from "vitest";
import { decodeState, encodeState } from "@/core/state";
import { mapStateCodec, withView, withWorld, type MapState } from "./state";

const view: MapState = { world: "europe", center: [-8123, -12001], zoom: 4.5, grid: false };

describe("mapStateCodec", () => {
  it("defaults to Bakurani with the grid on and the whole map in view", () => {
    expect(mapStateCodec.defaults).toEqual({ world: "kavkazi", center: null, zoom: null, grid: true });
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
  it("resets the view when the world changes and keeps the grid setting", () => {
    expect(withWorld(view, "kavkazi")).toEqual({ world: "kavkazi", center: null, zoom: null, grid: false });
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
