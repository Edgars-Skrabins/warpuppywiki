import { canvas, latLngBounds, type Canvas, type Map as LeafletMap } from "leaflet";
import { useMemo, useState } from "react";
import { Popup, Rectangle, Tooltip, useMap, useMapEvents } from "react-leaflet";
import type { Building, MapFile } from "@/core/data";
import { BuildingPopup } from "../components/BuildingPopup";
import { worldToLatLng } from "../leaflet/projection";
import { BUILDING_KINDS, BUILDING_STYLES, type BuildingKind } from "../logic/buildingStyle";
import { BUILDINGS_MIN_ZOOM } from "./layerDefinitions";
import { useTokenColors } from "./useTokenColors";

export interface BuildingsLayerProps {
  map: MapFile;
  buildings: readonly Building[];
  kinds: Record<BuildingKind, boolean>;
}

const KIND_TOKENS = BUILDING_KINDS.map((kind) => BUILDING_STYLES[kind].color);

const renderers = new WeakMap<LeafletMap, Canvas>();

function rendererFor(leafletMap: LeafletMap): Canvas {
  let renderer = renderers.get(leafletMap);
  if (renderer === undefined) {
    renderer = canvas({ padding: 0.5 });
    renderers.set(leafletMap, renderer);
  }
  return renderer;
}

export function BuildingsLayer({ map, buildings, kinds }: BuildingsLayerProps) {
  const leafletMap = useMap();
  const [zoom, setZoom] = useState(() => leafletMap.getZoom());
  useMapEvents({ zoomend: () => setZoom(leafletMap.getZoom()) });
  const renderer = rendererFor(leafletMap);
  const colors = useTokenColors(KIND_TOKENS);
  const colorOf = useMemo(
    () => new Map(BUILDING_KINDS.map((kind, index) => [kind, colors[index] ?? colors[0]])),
    [colors],
  );
  const boxes = useMemo(
    () =>
      buildings.map((building) => ({
        building,
        bounds: latLngBounds(
          worldToLatLng(map, building.min[0], building.min[1], leafletMap),
          worldToLatLng(map, building.max[0], building.max[1], leafletMap),
        ),
      })),
    [buildings, map, leafletMap],
  );

  if (zoom < BUILDINGS_MIN_ZOOM) {
    return null;
  }
  return (
    <>
      {boxes
        .filter(({ building }) => kinds[building.kind])
        .map(({ building, bounds }) => {
          const color = colorOf.get(building.kind);
          return (
            <Rectangle
              key={building.id}
              bounds={bounds}
              renderer={renderer}
              pathOptions={{ color, fillColor: color, weight: 1.5, opacity: 1, fillOpacity: 0.5 }}
            >
              <Tooltip sticky>{BUILDING_STYLES[building.kind].label}</Tooltip>
              <Popup>
                <BuildingPopup building={building} />
              </Popup>
            </Rectangle>
          );
        })}
    </>
  );
}
