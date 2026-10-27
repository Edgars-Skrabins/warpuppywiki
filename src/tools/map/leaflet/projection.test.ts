import { circle, map as createLeafletMap, type Map as LeafletMap } from "leaflet";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { MapFile } from "@/core/data";
import mapJson from "@/test/fixtures/data/25937608/maps/kavkazi/map.json";
import { imageBounds, mapCrs, worldBounds } from "./crs";
import { latLngToWorld, metersToLatLngDistance, worldToLatLng } from "./projection";

const kavkazi = mapJson as MapFile;

let leafletMap: LeafletMap;
let container: HTMLDivElement;

beforeEach(() => {
  container = document.createElement("div");
  container.style.width = "800px";
  container.style.height = "600px";
  document.body.append(container);
  leafletMap = createLeafletMap(container, { crs: mapCrs, center: [0, 0], zoom: 2 });
});

afterEach(() => {
  leafletMap.remove();
  container.remove();
});

describe("worldToLatLng", () => {
  it("maps the world minimum corner to image pixel (0, 0) and back", () => {
    const latLng = worldToLatLng(kavkazi, -16320, -20400, leafletMap);
    const pixel = leafletMap.project(latLng, 6);
    expect(pixel.x).toBeCloseTo(0);
    expect(pixel.y).toBeCloseTo(0);
    const [x, y] = latLngToWorld(kavkazi, latLng, leafletMap);
    expect(x).toBeCloseTo(-16320);
    expect(y).toBeCloseTo(-20400);
  });

  it("moves 1,000 pixels at native zoom for a point 1,000 m east", () => {
    const origin = leafletMap.project(worldToLatLng(kavkazi, -10000, -12000, leafletMap), 6);
    const east = leafletMap.project(worldToLatLng(kavkazi, -9000, -12000, leafletMap), 6);
    expect(east.x - origin.x).toBeCloseTo(1000);
    expect(east.y - origin.y).toBeCloseTo(0);
  });

  it("scales by metersPerPixel instead of assuming one meter per pixel", () => {
    const coarse: MapFile = { ...kavkazi, image: { ...kavkazi.image, metersPerPixel: 2 } };
    const origin = leafletMap.project(worldToLatLng(coarse, -10000, -12000, leafletMap), 6);
    const south = leafletMap.project(worldToLatLng(coarse, -10000, -11000, leafletMap), 6);
    expect(south.y - origin.y).toBeCloseTo(500);
    const [x, y] = latLngToWorld(coarse, worldToLatLng(coarse, -1234, -5678, leafletMap), leafletMap);
    expect(x).toBeCloseTo(-1234);
    expect(y).toBeCloseTo(-5678);
  });
});

describe("bounds", () => {
  it("covers the whole image, padding included", () => {
    const bounds = imageBounds(kavkazi, leafletMap);
    const topLeft = leafletMap.project(bounds.getNorthWest(), 6);
    const bottomRight = leafletMap.project(bounds.getSouthEast(), 6);
    expect([topLeft.x, topLeft.y]).toEqual([0, 0]);
    expect([bottomRight.x, bottomRight.y]).toEqual([16384, 16384]);
  });

  it("adds the pan margin around the world bounds", () => {
    const bounds = worldBounds(kavkazi, leafletMap, 0.1);
    const topLeft = leafletMap.project(bounds.getNorthWest(), 6);
    const bottomRight = leafletMap.project(bounds.getSouthEast(), 6);
    expect(topLeft.x).toBeCloseTo(-1632);
    expect(topLeft.y).toBeCloseTo(-1632);
    expect(bottomRight.x).toBeCloseTo(16320 + 1632);
    expect(bottomRight.y).toBeCloseTo(16320 + 1632);
  });
});

describe("metersToLatLngDistance", () => {
  it("gives a circle radius that spans the meters at native zoom", () => {
    const zone = circle(worldToLatLng(kavkazi, -8360, -11233, leafletMap), {
      radius: metersToLatLngDistance(kavkazi, 500, leafletMap),
    }).addTo(leafletMap);
    leafletMap.setZoom(6, { animate: false });
    const center = leafletMap.project(zone.getLatLng(), 6);
    const east = leafletMap.project(zone.getBounds().getNorthEast(), 6);
    expect(east.x - center.x).toBeCloseTo(500);
  });

  it("scales by metersPerPixel", () => {
    const coarse: MapFile = { ...kavkazi, image: { ...kavkazi.image, metersPerPixel: 2 } };
    expect(metersToLatLngDistance(coarse, 500, leafletMap)).toBeCloseTo(
      metersToLatLngDistance(kavkazi, 250, leafletMap),
    );
  });
});
