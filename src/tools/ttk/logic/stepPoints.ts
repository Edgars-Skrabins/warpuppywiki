import type { LinePoint } from "@/ui";

const STEP_EDGE = 0.01;

export function stepPoints(points: readonly LinePoint[]): LinePoint[] {
  return points.flatMap((point, index) => {
    const previous = points[index - 1];
    return previous !== undefined && previous.y !== point.y && previous.y !== null && point.y !== null
      ? [{ x: point.x - STEP_EDGE, y: previous.y }, point]
      : [point];
  });
}
