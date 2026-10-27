import { useMemo } from "react";
import { CircleMarker, Marker, Polyline, useMap } from "react-leaflet";
import type { MapFile } from "@/core/data";
import type { Vec2 } from "@/core/maps";
import { formatDistance } from "@/ui";
import { worldToLatLng } from "../leaflet/projection";
import { textIcon } from "../leaflet/textIcon";
import { formatBearing, type Measurement, type Segment } from "../plan/measure";
import styles from "./MeasureLayer.module.css";

export const PLAN_PANE = "plan";

function SegmentLabel({ map, segment }: { map: MapFile; segment: Segment }) {
  const leafletMap = useMap();
  const text = `${formatDistance(segment.length)} · ${formatBearing(segment.bearing)}`;
  const icon = useMemo(() => textIcon(text, styles.label, styles.labelText), [text]);
  return (
    <Marker
      position={worldToLatLng(map, segment.midpoint[0], segment.midpoint[1], leafletMap)}
      icon={icon}
      interactive={false}
      keyboard={false}
      pane={PLAN_PANE}
    />
  );
}

export function MeasureLayer({
  map,
  points,
  measurement,
}: {
  map: MapFile;
  points: readonly Vec2[];
  measurement: Measurement;
}) {
  const leafletMap = useMap();
  const positions = points.map(([x, y]) => worldToLatLng(map, x, y, leafletMap));
  if (positions.length === 0) {
    return null;
  }
  return (
    <>
      <Polyline positions={positions} pathOptions={{ className: styles.casing, interactive: false }} pane={PLAN_PANE} />
      <Polyline positions={positions} pathOptions={{ className: styles.line, interactive: false }} pane={PLAN_PANE} />
      {positions.map((position, index) => (
        <CircleMarker
          key={index}
          center={position}
          radius={4}
          pathOptions={{ className: styles.vertex, interactive: false }}
          pane={PLAN_PANE}
        />
      ))}
      {measurement.segments.map((segment, index) => (
        <SegmentLabel key={index} map={map} segment={segment} />
      ))}
    </>
  );
}
