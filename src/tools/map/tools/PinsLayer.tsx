import {
  divIcon,
  type LeafletEvent,
  type Map as LeafletMap,
  type Marker as LeafletMarker,
  type PopupEvent,
} from "leaflet";
import { memo, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Marker, Popup, useMap } from "react-leaflet";
import type { MapFile } from "@/core/data";
import { latLngToWorld, worldToLatLng } from "../leaflet/projection";
import { PIN_COLOR_TOKENS, type Pin, type PinChanges } from "../plan/plan";
import { PLAN_PANE } from "./MeasureLayer";
import { PinForm } from "./PinForm";
import { PinGlyph } from "./PinGlyph";
import styles from "./PinsLayer.module.css";

const PIN_SIZE = 26;
const POPUP_PADDING = 24;

function panIntoView(leafletMap: LeafletMap, element: HTMLElement | undefined) {
  if (element === undefined) {
    return;
  }
  const frame = leafletMap.getContainer().getBoundingClientRect();
  const box = element.getBoundingClientRect();
  const dx = Math.min(0, box.left - frame.left - POPUP_PADDING) + Math.max(0, box.right - frame.right + POPUP_PADDING);
  const dy = Math.min(0, box.top - frame.top - POPUP_PADDING) + Math.max(0, box.bottom - frame.bottom + POPUP_PADDING);
  if (dx !== 0 || dy !== 0) {
    leafletMap.panBy([dx, dy]);
  }
}

export interface PinsLayerProps {
  map: MapFile;
  pins: readonly Pin[];
  editingPinId: number | null;
  onEditingChange: (id: number | null) => void;
  onChange: (id: number, changes: PinChanges) => void;
  onDelete: (id: number) => void;
}

interface PinMarkerProps extends Omit<PinsLayerProps, "pins" | "editingPinId"> {
  pin: Pin;
  editing: boolean;
}

function PinMarker({ map, pin, editing, onEditingChange, onChange, onDelete }: PinMarkerProps) {
  const leafletMap = useMap();
  const markerRef = useRef<LeafletMarker>(null);
  const [content] = useState(() => document.createElement("span"));
  const icon = useMemo(
    () =>
      divIcon({
        className: styles.pin,
        html: content,
        iconSize: [PIN_SIZE, PIN_SIZE],
        popupAnchor: [0, -PIN_SIZE / 2],
      }),
    [content],
  );
  const eventHandlers = useMemo(
    () => ({
      dragend: (event: LeafletEvent) => {
        const marker = event.target as LeafletMarker;
        onChange(pin.id, { position: latLngToWorld(map, marker.getLatLng(), leafletMap) });
      },
      popupopen: (event: PopupEvent) => {
        panIntoView(leafletMap, event.popup.getElement());
        onEditingChange(pin.id);
      },
      popupclose: () => onEditingChange(null),
    }),
    [map, leafletMap, pin.id, onChange, onEditingChange],
  );

  useEffect(() => {
    if (editing) {
      markerRef.current?.openPopup();
    }
  }, [editing]);

  const [x, y] = pin.position;
  const position = useMemo(() => worldToLatLng(map, x, y, leafletMap), [map, x, y, leafletMap]);
  return (
    <Marker ref={markerRef} position={position} icon={icon} draggable pane={PLAN_PANE} eventHandlers={eventHandlers}>
      {createPortal(
        <>
          <span
            className={styles.tile}
            style={{ "--pin-color": `var(${PIN_COLOR_TOKENS[pin.color]})` } as CSSProperties}
          >
            <PinGlyph icon={pin.icon} size={16} />
          </span>
          <span className={styles.tag}>{pin.label}</span>
        </>,
        content,
      )}
      <Popup autoPan={false} pane="popupPane">
        <PinForm
          key={pin.id}
          pin={pin}
          onChange={(changes) => onChange(pin.id, changes)}
          onDelete={() => onDelete(pin.id)}
          onDone={() => markerRef.current?.closePopup()}
        />
      </Popup>
    </Marker>
  );
}

export const PinsLayer = memo(function PinsLayer({ pins, editingPinId, ...props }: PinsLayerProps) {
  return (
    <>
      {pins.map((pin) => (
        <PinMarker key={pin.id} pin={pin} editing={pin.id === editingPinId} {...props} />
      ))}
    </>
  );
});
