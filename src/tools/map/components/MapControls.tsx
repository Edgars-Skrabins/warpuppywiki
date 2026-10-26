import type { Map as LeafletMap } from "leaflet";
import type { MapFile } from "@/core/data";
import { Button, IconButton, Switch } from "@/ui";
import { MAX_ZOOM, worldBounds } from "../leaflet/crs";
import styles from "./MapControls.module.css";

export interface MapControlsProps {
  map: MapFile;
  leafletMap: LeafletMap;
  zoom: number | null;
  grid: boolean;
  onGridChange: (grid: boolean) => void;
}

export function MapControls({ map, leafletMap, zoom, grid, onGridChange }: MapControlsProps) {
  return (
    <div className={styles.controls}>
      <div className={styles.panel}>
        <div className={styles.zoom}>
          <IconButton
            aria-label="Zoom in"
            size="sm"
            variant="secondary"
            isDisabled={zoom !== null && zoom >= MAX_ZOOM}
            onPress={() => leafletMap.zoomIn()}
          >
            +
          </IconButton>
          <IconButton
            aria-label="Zoom out"
            size="sm"
            variant="secondary"
            isDisabled={zoom !== null && zoom <= map.tiles.minZoom}
            onPress={() => leafletMap.zoomOut()}
          >
            −
          </IconButton>
        </div>
        <Button size="sm" variant="secondary" onPress={() => leafletMap.fitBounds(worldBounds(map, leafletMap))}>
          Fit map
        </Button>
      </div>
      <div className={styles.panel}>
        <Switch isSelected={grid} onChange={onGridChange}>
          Grid
        </Switch>
        <p className={styles.note}>Grid by warpuppywiki; the in-game grid may differ.</p>
      </div>
    </div>
  );
}
