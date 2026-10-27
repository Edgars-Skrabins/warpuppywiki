import { divIcon, type DivIcon, type LatLng, type Map as LeafletMap } from "leaflet";
import { useMemo, useState } from "react";
import { Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import type { MapFile } from "@/core/data";
import type { Vec2 } from "@/core/maps";
import { latLngToWorld, worldToLatLng } from "../leaflet/projection";
import { gridLabels, gridLines, visibleLabels, type GridLabel, type GridLine } from "../logic/grid";
import styles from "./GridLayer.module.css";

export const MINOR_GRID_MIN_ZOOM = 5;

interface GridView {
  zoom: number;
  min: Vec2;
  max: Vec2;
}

function readView(map: MapFile, leafletMap: LeafletMap): GridView {
  const bounds = leafletMap.getBounds();
  return {
    zoom: leafletMap.getZoom(),
    min: latLngToWorld(map, bounds.getNorthWest(), leafletMap),
    max: latLngToWorld(map, bounds.getSouthEast(), leafletMap),
  };
}

function linePositions(map: MapFile, lines: readonly GridLine[], leafletMap: LeafletMap): LatLng[][] {
  const { min, max } = map.bounds;
  return lines.map((line) =>
    line.axis === "x"
      ? [worldToLatLng(map, line.position, min[1], leafletMap), worldToLatLng(map, line.position, max[1], leafletMap)]
      : [worldToLatLng(map, min[0], line.position, leafletMap), worldToLatLng(map, max[0], line.position, leafletMap)],
  );
}

function labelIcon(label: GridLabel): DivIcon {
  return divIcon({
    className: label.axis === "x" ? styles.columnLabel : styles.rowLabel,
    html: `<span class="${styles.labelText}">${label.text}</span>`,
    iconSize: [0, 0],
  });
}

export function GridLayer({ map }: { map: MapFile }) {
  const leafletMap = useMap();
  const [view, setView] = useState(() => readView(map, leafletMap));
  useMapEvents({
    move: () => setView(readView(map, leafletMap)),
    zoomend: () => setView(readView(map, leafletMap)),
  });

  const minor = view.zoom >= MINOR_GRID_MIN_ZOOM;
  const lines = useMemo(() => gridLines(map.bounds, { minor }), [map, minor]);
  const positions = useMemo(() => {
    const major = lines.filter((line) => line.major);
    const rest = lines.filter((line) => !line.major);
    return { major: linePositions(map, major, leafletMap), minor: linePositions(map, rest, leafletMap) };
  }, [map, lines, leafletMap]);
  const labels = useMemo(() => gridLabels(map.bounds), [map]);
  const icons = useMemo(() => new Map(labels.map((label) => [label, labelIcon(label)])), [labels]);

  const min: Vec2 = [Math.max(map.bounds.min[0], view.min[0]), Math.max(map.bounds.min[1], view.min[1])];
  const max: Vec2 = [Math.min(map.bounds.max[0], view.max[0]), Math.min(map.bounds.max[1], view.max[1])];
  const pixelsPerMeter = 2 ** (view.zoom - map.tiles.maxZoom) / map.image.metersPerPixel;
  const placed = visibleLabels(labels, { pixelsPerMeter, min, max });

  return (
    <>
      {minor && <Polyline positions={positions.minor} pathOptions={{ className: styles.minor, interactive: false }} />}
      <Polyline positions={positions.major} pathOptions={{ className: styles.major, interactive: false }} />
      {placed.map(({ label, along }) => (
        <Marker
          key={`${label.axis}${label.text}`}
          position={
            label.axis === "x"
              ? worldToLatLng(map, along, min[1], leafletMap)
              : worldToLatLng(map, min[0], along, leafletMap)
          }
          icon={icons.get(label)}
          interactive={false}
          keyboard={false}
        />
      ))}
    </>
  );
}
