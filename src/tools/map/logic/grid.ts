import type { Vec2 } from "@/core/maps";

export const MAJOR_GRID_SPACING = 1000;
export const MINOR_GRID_SPACING = 100;

export interface GridBounds {
  min: Vec2;
  max: Vec2;
}

export type GridAxis = "x" | "y";

export interface GridLine {
  axis: GridAxis;
  position: number;
  major: boolean;
}

export interface GridLabel {
  axis: GridAxis;
  text: string;
  start: number;
  end: number;
}

function cellCount(min: number, max: number, spacing: number): number {
  return Math.ceil((max - min) / spacing - 1e-9);
}

function axisLines(axis: GridAxis, min: number, max: number, spacing: number, major: boolean): GridLine[] {
  const count = cellCount(min, max, spacing);
  const lines: GridLine[] = [];
  for (let index = 0; index <= count; index++) {
    lines.push({ axis, position: Math.min(min + index * spacing, max), major });
  }
  return lines;
}

function minorLines(axis: GridAxis, min: number, max: number): GridLine[] {
  const ratio = MAJOR_GRID_SPACING / MINOR_GRID_SPACING;
  return axisLines(axis, min, max, MINOR_GRID_SPACING, false).filter(
    (line, index) => index % ratio !== 0 && line.position < max,
  );
}

export function gridLines(bounds: GridBounds, { minor = false }: { minor?: boolean } = {}): GridLine[] {
  const { min, max } = bounds;
  const lines = [
    ...axisLines("x", min[0], max[0], MAJOR_GRID_SPACING, true),
    ...axisLines("y", min[1], max[1], MAJOR_GRID_SPACING, true),
  ];
  return minor ? [...lines, ...minorLines("x", min[0], max[0]), ...minorLines("y", min[1], max[1])] : lines;
}

export function columnName(index: number): string {
  let name = "";
  let rest = index + 1;
  while (rest > 0) {
    const letter = (rest - 1) % 26;
    name = String.fromCharCode(65 + letter) + name;
    rest = Math.floor((rest - 1) / 26);
  }
  return name;
}

export function rowName(index: number): string {
  return String(index + 1);
}

function axisLabels(axis: GridAxis, min: number, max: number, name: (index: number) => string): GridLabel[] {
  return Array.from({ length: cellCount(min, max, MAJOR_GRID_SPACING) }, (_, index) => ({
    axis,
    text: name(index),
    start: min + index * MAJOR_GRID_SPACING,
    end: Math.min(min + (index + 1) * MAJOR_GRID_SPACING, max),
  }));
}

export function gridLabels(bounds: GridBounds): GridLabel[] {
  const { min, max } = bounds;
  return [...axisLabels("x", min[0], max[0], columnName), ...axisLabels("y", min[1], max[1], rowName)];
}

function cellIndex(value: number, min: number, max: number): number {
  const last = cellCount(min, max, MAJOR_GRID_SPACING) - 1;
  return Math.min(Math.floor((value - min) / MAJOR_GRID_SPACING), last);
}

export function gridRef(bounds: GridBounds, x: number, y: number): string | null {
  const { min, max } = bounds;
  if (!(x >= min[0] && x <= max[0] && y >= min[1] && y <= max[1])) {
    return null;
  }
  return columnName(cellIndex(x, min[0], max[0])) + rowName(cellIndex(y, min[1], max[1]));
}
