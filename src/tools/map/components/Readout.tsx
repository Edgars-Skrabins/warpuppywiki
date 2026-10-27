import type { DataState, MapFile } from "@/core/data";
import type { Heightmap, Vec2 } from "@/core/maps";
import { formatNumber } from "@/ui";
import { gridRef } from "../logic/grid";
import styles from "./Readout.module.css";

export interface ReadoutProps {
  map: MapFile;
  cursor: Vec2 | null;
  heightmap: DataState<Heightmap | null>;
  zoom: number | null;
}

const EMPTY = "—";

function meters(value: number | null | undefined): string {
  return value === null || value === undefined ? EMPTY : `${formatNumber(Math.round(value))} m`;
}

function groundHeight(heightmap: DataState<Heightmap | null>, cursor: Vec2 | null): number | null {
  if (cursor === null || heightmap.status !== "success" || heightmap.data === null) {
    return null;
  }
  return heightmap.data.heightAt(cursor[0], cursor[1]);
}

export function Readout({ map, cursor, heightmap, zoom }: ReadoutProps) {
  const cells = [
    { label: "Grid", value: (cursor && gridRef(map.bounds, cursor[0], cursor[1])) ?? EMPTY },
    { label: "X", value: meters(cursor?.[0]) },
    { label: "Y", value: meters(cursor?.[1]) },
    { label: "Height", value: meters(groundHeight(heightmap, cursor)) },
    { label: "Zoom", value: zoom === null ? EMPTY : formatNumber(zoom) },
  ];
  return (
    <dl className={styles.readout} aria-label="Cursor position">
      {cells.map((cell) => (
        <div key={cell.label} className={styles.cell}>
          <dt className={styles.label}>{cell.label}</dt>
          <dd className={styles.value}>{cell.value}</dd>
        </div>
      ))}
    </dl>
  );
}
