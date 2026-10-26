import { CRS, latLngBounds, type LatLngBounds, type Map as LeafletMap } from "leaflet";
import type { MapFile } from "@/core/data";
import { pixelToLatLng, worldToLatLng } from "./projection";

export const mapCrs = CRS.Simple;

export const PAN_MARGIN = 0.1;

export const MAX_ZOOM = 8;

export function imageBounds(map: MapFile, leafletMap: LeafletMap): LatLngBounds {
  return latLngBounds(
    pixelToLatLng(map, 0, 0, leafletMap),
    pixelToLatLng(map, map.image.width, map.image.height, leafletMap),
  );
}

export function worldBounds(map: MapFile, leafletMap: LeafletMap, margin = 0): LatLngBounds {
  const { min, max } = map.bounds;
  const dx = (max[0] - min[0]) * margin;
  const dy = (max[1] - min[1]) * margin;
  return latLngBounds(
    worldToLatLng(map, min[0] - dx, min[1] - dy, leafletMap),
    worldToLatLng(map, max[0] + dx, max[1] + dy, leafletMap),
  );
}
