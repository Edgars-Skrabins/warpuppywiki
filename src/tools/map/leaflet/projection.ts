import type { LatLng, Map as LeafletMap } from "leaflet";
import type { MapFile } from "@/core/data";
import { pixelToWorld, worldToPixel, type Vec2 } from "@/core/maps";

export function pixelToLatLng(map: MapFile, px: number, py: number, leafletMap: LeafletMap): LatLng {
  return leafletMap.unproject([px, py], map.tiles.maxZoom);
}

export function worldToLatLng(map: MapFile, x: number, y: number, leafletMap: LeafletMap): LatLng {
  const [px, py] = worldToPixel(map, x, y);
  return pixelToLatLng(map, px, py, leafletMap);
}

export function latLngToWorld(map: MapFile, latLng: LatLng, leafletMap: LeafletMap): Vec2 {
  const point = leafletMap.project(latLng, map.tiles.maxZoom);
  return pixelToWorld(map, point.x, point.y);
}

export function metersToLatLngDistance(map: MapFile, meters: number, leafletMap: LeafletMap): number {
  const pixels = meters / map.image.metersPerPixel;
  return Math.abs(pixelToLatLng(map, pixels, 0, leafletMap).lng - pixelToLatLng(map, 0, 0, leafletMap).lng);
}
