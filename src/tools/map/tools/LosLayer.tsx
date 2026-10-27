import { divIcon, type LeafletEvent, type Marker as LeafletMarker } from "leaflet";
import { memo, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CircleMarker, Marker, Polyline, useMap } from "react-leaflet";
import type { MapFile } from "@/core/data";
import type { Vec2 } from "@/core/maps";
import { latLngToWorld, worldToLatLng } from "../leaflet/projection";
import { textIcon } from "../leaflet/textIcon";
import type { LosResult } from "../los/losModel";
import type { PinIcon } from "../plan/plan";
import { PLAN_PANE } from "./MeasureLayer";
import { PinGlyph } from "./PinGlyph";
import styles from "./LosLayer.module.css";

const POINT_SIZE = 24;

interface PointMarkerProps {
  map: MapFile;
  position: Vec2;
  label: string;
  glyph: PinIcon;
  draggable: boolean;
  onMove?: (point: Vec2) => void;
}

function PointMarker({ map, position, label, glyph, draggable, onMove }: PointMarkerProps) {
  const leafletMap = useMap();
  const [content] = useState(() => document.createElement("span"));
  const icon = useMemo(
    () => divIcon({ className: styles.point, html: content, iconSize: [POINT_SIZE, POINT_SIZE] }),
    [content],
  );
  const latLng = useMemo(() => worldToLatLng(map, position[0], position[1], leafletMap), [map, position, leafletMap]);
  const eventHandlers = useMemo(
    () => ({
      dragend: (event: LeafletEvent) => {
        onMove?.(latLngToWorld(map, (event.target as LeafletMarker).getLatLng(), leafletMap));
      },
    }),
    [map, leafletMap, onMove],
  );
  return (
    <Marker position={latLng} icon={icon} draggable={draggable} pane={PLAN_PANE} eventHandlers={eventHandlers}>
      {createPortal(
        <>
          <span className={styles.tile}>
            <PinGlyph icon={glyph} size={14} />
          </span>
          <span className={styles.tag}>{label}</span>
        </>,
        content,
      )}
    </Marker>
  );
}

export interface LosLayerProps {
  map: MapFile;
  observer: Vec2 | null;
  target: Vec2 | null;
  result: LosResult | null;
  label: string | null;
  hoverDistance: number | null;
  onObserverMove: (point: Vec2) => void;
  onTargetMove: (point: Vec2) => void;
}

function along(observer: Vec2, target: Vec2, distance: number, length: number): Vec2 {
  const t = length === 0 ? 0 : Math.min(Math.max(distance / length, 0), 1);
  return [observer[0] + (target[0] - observer[0]) * t, observer[1] + (target[1] - observer[1]) * t];
}

export const LosLayer = memo(function LosLayer({
  map,
  observer,
  target,
  result,
  label,
  hoverDistance,
  onObserverMove,
  onTargetMove,
}: LosLayerProps) {
  const leafletMap = useMap();
  const toLatLng = (point: Vec2) => worldToLatLng(map, point[0], point[1], leafletMap);
  const labelIcon = useMemo(
    () =>
      label === null ? null : textIcon(label, styles.label, result?.clear ? styles.clearText : styles.blockedText),
    [label, result?.clear],
  );
  const obstructionIcon = useMemo(() => textIcon("", styles.obstruction, styles.obstructionMark), []);

  const blockedAt =
    observer !== null && target !== null && result?.obstruction
      ? along(observer, target, result.obstruction.distance, result.length)
      : null;
  const hover =
    observer !== null && target !== null && result !== null && hoverDistance !== null
      ? along(observer, target, hoverDistance, result.length)
      : null;
  const middle = observer !== null && target !== null ? along(observer, target, 1, 2) : null;

  return (
    <>
      {observer !== null && target !== null && result !== null && (
        <>
          <Polyline
            positions={[toLatLng(observer), toLatLng(target)]}
            pathOptions={{ className: styles.casing, interactive: false }}
            pane={PLAN_PANE}
          />
          <Polyline
            positions={[toLatLng(observer), toLatLng(blockedAt ?? target)]}
            pathOptions={{ className: styles.clearLine, interactive: false }}
            pane={PLAN_PANE}
          />
          {blockedAt !== null && (
            <>
              <Polyline
                positions={[toLatLng(blockedAt), toLatLng(target)]}
                pathOptions={{ className: styles.blockedLine, interactive: false }}
                pane={PLAN_PANE}
              />
              <Marker
                position={toLatLng(blockedAt)}
                icon={obstructionIcon}
                interactive={false}
                keyboard={false}
                pane={PLAN_PANE}
              />
            </>
          )}
        </>
      )}
      {observer !== null && target !== null && result === null && (
        <Polyline
          positions={[toLatLng(observer), toLatLng(target)]}
          pathOptions={{ className: styles.unknownLine, interactive: false }}
          pane={PLAN_PANE}
        />
      )}
      {middle !== null && labelIcon !== null && (
        <Marker position={toLatLng(middle)} icon={labelIcon} interactive={false} keyboard={false} pane={PLAN_PANE} />
      )}
      {hover !== null && (
        <CircleMarker
          center={toLatLng(hover)}
          radius={6}
          pathOptions={{ className: styles.hover, interactive: false }}
          pane={PLAN_PANE}
        />
      )}
      {observer !== null && (
        <PointMarker map={map} position={observer} label="Observer" glyph="circle" draggable onMove={onObserverMove} />
      )}
      {target !== null && (
        <PointMarker map={map} position={target} label="Target" glyph="target" draggable onMove={onTargetMove} />
      )}
    </>
  );
});

export const ViewshedObserver = PointMarker;
