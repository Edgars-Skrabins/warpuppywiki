import { useMemo } from "react";
import { TileLayer as LeafletTileLayer, useMap } from "react-leaflet";
import type { MapFile, World } from "@/core/data";
import { imageBounds, MAX_ZOOM } from "../leaflet/crs";

export interface TileLayerProps {
  map: MapFile;
  world: World;
  maxNativeZoom: number;
}

function tileUrl(world: World, map: MapFile): string {
  return `${import.meta.env.BASE_URL}assets/maps/${world}/${map.tiles.urlTemplate}`;
}

export function TileLayer({ map, world, maxNativeZoom }: TileLayerProps) {
  const leafletMap = useMap();
  const bounds = useMemo(() => imageBounds(map, leafletMap), [map, leafletMap]);
  return (
    <LeafletTileLayer
      url={tileUrl(world, map)}
      tileSize={map.tiles.size}
      minZoom={map.tiles.minZoom}
      maxNativeZoom={maxNativeZoom}
      maxZoom={MAX_ZOOM}
      bounds={bounds}
      noWrap
    />
  );
}
