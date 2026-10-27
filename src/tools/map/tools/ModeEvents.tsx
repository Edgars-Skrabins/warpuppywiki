import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import type { MapFile } from "@/core/data";
import type { Vec2 } from "@/core/maps";
import { latLngToWorld } from "../leaflet/projection";
import type { MapMode } from "./useMapMode";

export interface ModeEventsProps {
  map: MapFile;
  mode: MapMode;
  onClick: (point: Vec2) => void;
  onDoubleClick: () => void;
}

export function ModeEvents({ map, mode, onClick, onDoubleClick }: ModeEventsProps) {
  const leafletMap = useMap();
  useMapEvents({
    click: (event) => {
      if (mode !== "pan") {
        onClick(latLngToWorld(map, event.latlng, leafletMap));
      }
    },
    dblclick: () => {
      if (mode !== "pan") {
        onDoubleClick();
      }
    },
  });

  useEffect(() => {
    const container = leafletMap.getContainer();
    if (mode === "pan") {
      leafletMap.doubleClickZoom.enable();
      delete container.dataset.mode;
      return;
    }
    leafletMap.doubleClickZoom.disable();
    container.dataset.mode = mode;
    return () => {
      leafletMap.doubleClickZoom.enable();
      delete container.dataset.mode;
    };
  }, [leafletMap, mode]);

  return null;
}
