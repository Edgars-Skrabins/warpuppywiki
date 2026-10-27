import type { MapFile } from "@/core/data";

function isPositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function mapProblem(map: MapFile): string | null {
  const { min, max } = map.bounds;
  if (![...min, ...max].every(Number.isFinite) || !(max[0] > min[0] && max[1] > min[1])) {
    return "The map's bounds are empty or invalid.";
  }
  if (!isPositive(map.image.metersPerPixel) || !isPositive(map.image.width) || !isPositive(map.image.height)) {
    return "The map image has an invalid size or scale.";
  }
  const { size, minZoom, maxZoom } = map.tiles;
  if (
    !isPositive(size) ||
    !Number.isInteger(minZoom) ||
    !Number.isInteger(maxZoom) ||
    minZoom < 0 ||
    maxZoom < minZoom
  ) {
    return "The map's tile settings are invalid.";
  }
  return null;
}

export function syncedNativeZoom(map: MapFile, syncedMaxZoom: number | null | undefined): number | null {
  if (syncedMaxZoom === null || syncedMaxZoom === undefined || !Number.isFinite(syncedMaxZoom)) {
    return null;
  }
  const zoom = Math.min(Math.floor(syncedMaxZoom), map.tiles.maxZoom);
  return zoom >= map.tiles.minZoom ? zoom : null;
}
