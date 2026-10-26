import type { Vec2 } from "@/core/maps";

export const MAJOR_GRID_SPACING = 1000;
export const MINOR_GRID_SPACING = 100;
export const MAX_GRID_CELLS = 2000;
export const MIN_LABEL_SPACING_PX = 28;
export const LABEL_CORNER_CLEARANCE_PX = 32;

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
  index: number;
  text: string;
  start: number;
  end: number;
}

function cellCount(min: number, max: number, spacing: number): number {
  const count = Math.ceil((max - min) / spacing - 1e-9);
  return Number.isFinite(count) && count > 0 && count <= MAX_GRID_CELLS ? count : 0;
}

function axisLines(axis: GridAxis, min: number, max: number, spacing: number, major: boolean): GridLine[] {
  const count = cellCount(min, max, spacing);
  const lines: GridLine[] = [];
  for (let index = 0; count > 0 && index <= count; index++) {
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
    index,
    text: name(index),
    start: min + index * MAJOR_GRID_SPACING,
    end: Math.min(min + (index + 1) * MAJOR_GRID_SPACING, max),
  }));
}

export function gridLabels(bounds: GridBounds): GridLabel[] {
  const { min, max } = bounds;
  return [...axisLabels("x", min[0], max[0], columnName), ...axisLabels("y", min[1], max[1], rowName)];
}

export interface LabelView {
  pixelsPerMeter: number;
  min: Vec2;
  max: Vec2;
}

export interface PlacedLabel {
  label: GridLabel;
  along: number;
}

export function visibleLabels(labels: readonly GridLabel[], { pixelsPerMeter, min, max }: LabelView): PlacedLabel[] {
  if (!(pixelsPerMeter > 0)) {
    return [];
  }
  const stride = Math.max(1, Math.ceil(MIN_LABEL_SPACING_PX / (MAJOR_GRID_SPACING * pixelsPerMeter)));
  const clearance = LABEL_CORNER_CLEARANCE_PX / pixelsPerMeter;
  return labels.flatMap((label) => {
    const axis = label.axis === "x" ? 0 : 1;
    const low = Math.max(label.start, min[axis] + clearance);
    const high = Math.min(label.end, max[axis] - clearance);
    if (label.index % stride !== 0 || low > high) {
      return [];
    }
    const middle = (label.start + label.end) / 2;
    if (middle > high && label.start >= min[axis]) {
      return [{ label, along: high }];
    }
    return [{ label, along: middle >= low && middle <= high ? middle : low }];
  });
}

function cellIndex(value: number, min: number, max: number): number {
  const last = cellCount(min, max, MAJOR_GRID_SPACING) - 1;
  return Math.min(Math.floor((value - min) / MAJOR_GRID_SPACING), last);
}

export function gridRef(bounds: GridBounds, x: number, y: number): string | null {
  const { min, max } = bounds;
  const usable = cellCount(min[0], max[0], MAJOR_GRID_SPACING) > 0 && cellCount(min[1], max[1], MAJOR_GRID_SPACING) > 0;
  if (!usable || !(x >= min[0] && x <= max[0] && y >= min[1] && y <= max[1])) {
    return null;
  }
  return columnName(cellIndex(x, min[0], max[0])) + rowName(cellIndex(y, min[1], max[1]));
}
