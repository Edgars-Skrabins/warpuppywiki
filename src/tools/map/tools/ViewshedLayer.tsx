import { latLngBounds } from "leaflet";
import { memo, useMemo } from "react";
import { ImageOverlay, useMap } from "react-leaflet";
import type { MapFile } from "@/core/data";
import { worldToLatLng } from "../leaflet/projection";
import { useTokenColors } from "../layers/useTokenColors";
import { VIEWSHED_HIDDEN, VIEWSHED_VISIBLE, type Viewshed } from "../los/viewshed";
import { PLAN_PANE } from "./MeasureLayer";
import styles from "./ViewshedLayer.module.css";

const COLOR_TOKENS = ["--color-success", "--color-danger"];
const VISIBLE_ALPHA = 0.45;
const HIDDEN_ALPHA = 0.3;

function viewshedImage(viewshed: Viewshed, visible: string, hidden: string): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = viewshed.size;
  canvas.height = viewshed.size;
  const context = canvas.getContext("2d");
  if (context === null) {
    return null;
  }
  for (let row = 0; row < viewshed.size; row++) {
    for (let column = 0; column < viewshed.size; column++) {
      const cell = viewshed.cells[row * viewshed.size + column];
      if (cell === VIEWSHED_VISIBLE || cell === VIEWSHED_HIDDEN) {
        context.fillStyle = cell === VIEWSHED_VISIBLE ? visible : hidden;
        context.globalAlpha = cell === VIEWSHED_VISIBLE ? VISIBLE_ALPHA : HIDDEN_ALPHA;
        context.fillRect(column, row, 1, 1);
      }
    }
  }
  return canvas.toDataURL();
}

export const ViewshedLayer = memo(function ViewshedLayer({ map, viewshed }: { map: MapFile; viewshed: Viewshed }) {
  const leafletMap = useMap();
  const [visible, hidden] = useTokenColors(COLOR_TOKENS);
  const url = useMemo(() => viewshedImage(viewshed, visible ?? "", hidden ?? ""), [viewshed, visible, hidden]);
  const bounds = useMemo(() => {
    const extent = viewshed.size * viewshed.cellSize;
    return latLngBounds(
      worldToLatLng(map, viewshed.origin[0], viewshed.origin[1], leafletMap),
      worldToLatLng(map, viewshed.origin[0] + extent, viewshed.origin[1] + extent, leafletMap),
    );
  }, [map, viewshed, leafletMap]);
  if (url === null) {
    return null;
  }
  return <ImageOverlay url={url} bounds={bounds} pane={PLAN_PANE} interactive={false} className={styles.image} />;
});
