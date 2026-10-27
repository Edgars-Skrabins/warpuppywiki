import { useMemo } from "react";
import { Circle, Marker, useMap } from "react-leaflet";
import type { MapFile } from "@/core/data";
import { formatDistance } from "@/ui";
import { metersToLatLngDistance, worldToLatLng } from "../leaflet/projection";
import { textIcon } from "../leaflet/textIcon";
import type { RingSet } from "../plan/plan";
import { PLAN_PANE } from "./MeasureLayer";
import styles from "./RangeRingsLayer.module.css";

function RingLabel({ map, ringSet, distance }: { map: MapFile; ringSet: RingSet; distance: number }) {
  const leafletMap = useMap();
  const text = formatDistance(distance);
  const icon = useMemo(() => textIcon(text, styles.label, styles.labelText), [text]);
  const [x, y] = ringSet.center;
  return (
    <Marker
      position={worldToLatLng(map, x, y - distance, leafletMap)}
      icon={icon}
      interactive={false}
      keyboard={false}
      pane={PLAN_PANE}
    />
  );
}

function RingSetLayer({ map, ringSet }: { map: MapFile; ringSet: RingSet }) {
  const leafletMap = useMap();
  const center = worldToLatLng(map, ringSet.center[0], ringSet.center[1], leafletMap);
  const centerIcon = useMemo(() => textIcon("", styles.center, styles.centerMark), []);
  return (
    <>
      {ringSet.distances.map((distance) => (
        <Circle
          key={`casing${distance}`}
          center={center}
          radius={metersToLatLngDistance(map, distance, leafletMap)}
          pathOptions={{ className: styles.casing, fill: false, interactive: false }}
          pane={PLAN_PANE}
        />
      ))}
      {ringSet.distances.map((distance) => (
        <Circle
          key={distance}
          center={center}
          radius={metersToLatLngDistance(map, distance, leafletMap)}
          pathOptions={{ className: styles.ring, fill: false, interactive: false }}
          pane={PLAN_PANE}
        />
      ))}
      {ringSet.distances.map((distance) => (
        <RingLabel key={distance} map={map} ringSet={ringSet} distance={distance} />
      ))}
      <Marker position={center} icon={centerIcon} interactive={false} keyboard={false} pane={PLAN_PANE} />
    </>
  );
}

export function RangeRingsLayer({ map, rings }: { map: MapFile; rings: readonly RingSet[] }) {
  return (
    <>
      {rings.map((ringSet) => (
        <RingSetLayer key={ringSet.id} map={map} ringSet={ringSet} />
      ))}
    </>
  );
}
