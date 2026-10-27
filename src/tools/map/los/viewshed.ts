import { lineOfSight } from "@/core/maps/lineOfSight";
import type { Box, HeightFn, Vec2, Vec3 } from "@/core/maps/types";
import { LOS_STEP } from "./constants";

export const VIEWSHED_OUTSIDE = 0;
export const VIEWSHED_VISIBLE = 1;
export const VIEWSHED_HIDDEN = 2;
export const VIEWSHED_CELL_SIZE = 8;
export const VIEWSHED_RADII = [250, 500, 1000] as const;
export const VIEWSHED_MAX_RADIUS = 1000;

export interface ViewshedInput {
  observer: Vec2;
  radius: number;
  cellSize: number;
  eyeHeight: number;
  targetHeight: number;
  buildings: readonly Box[];
}

export interface Viewshed {
  observer: Vec2;
  radius: number;
  cellSize: number;
  size: number;
  origin: Vec2;
  cells: Uint8Array;
}

export function computeViewshed(
  input: ViewshedInput,
  heightAt: HeightFn,
  onProgress: (fraction: number) => void = () => undefined,
): Viewshed | null {
  const radius = Math.min(Math.max(input.radius, 0), VIEWSHED_MAX_RADIUS);
  const cellSize = Math.max(input.cellSize, 1);
  const [ox, oy] = input.observer;
  const ground = heightAt(ox, oy);
  if (ground === null || radius === 0) {
    return null;
  }
  const eye: Vec3 = [ox, oy, ground + input.eyeHeight];
  const size = Math.ceil((radius * 2) / cellSize);
  const origin: Vec2 = [ox - (size * cellSize) / 2, oy - (size * cellSize) / 2];
  const nearby = input.buildings.filter(
    (box) =>
      box.max[0] >= ox - radius && box.min[0] <= ox + radius && box.max[1] >= oy - radius && box.min[1] <= oy + radius,
  );
  const cells = new Uint8Array(size * size);
  for (let row = 0; row < size; row++) {
    const y = origin[1] + (row + 0.5) * cellSize;
    for (let column = 0; column < size; column++) {
      const x = origin[0] + (column + 0.5) * cellSize;
      if (Math.hypot(x - ox, y - oy) > radius) {
        continue;
      }
      const cellGround = heightAt(x, y);
      if (cellGround === null) {
        continue;
      }
      const visible = lineOfSight(eye, [x, y, cellGround + input.targetHeight], {
        terrain: heightAt,
        buildings: nearby,
        step: LOS_STEP,
      });
      cells[row * size + column] = visible ? VIEWSHED_VISIBLE : VIEWSHED_HIDDEN;
    }
    onProgress((row + 1) / size);
  }
  return { observer: input.observer, radius, cellSize, size, origin, cells };
}
