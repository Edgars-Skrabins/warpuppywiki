import { describe, expect, it } from "vitest";
import { computeViewshed, VIEWSHED_HIDDEN, VIEWSHED_OUTSIDE, VIEWSHED_VISIBLE, type Viewshed } from "./viewshed";

const wall = (x: number) => (x >= 100 && x <= 110 ? 50 : 0);

function cellAt(viewshed: Viewshed, x: number, y: number): number {
  const column = Math.floor((x - viewshed.origin[0]) / viewshed.cellSize);
  const row = Math.floor((y - viewshed.origin[1]) / viewshed.cellSize);
  return viewshed.cells[row * viewshed.size + column]!;
}

const input = {
  observer: [0, 0] as const,
  radius: 250,
  cellSize: 10,
  eyeHeight: 1.68,
  targetHeight: 1.68,
  buildings: [],
};

describe("computeViewshed", () => {
  it("hides cells behind a wall and shows cells in front of it", () => {
    const viewshed = computeViewshed(input, wall)!;
    expect(viewshed.size).toBe(50);
    expect(cellAt(viewshed, 55, 5)).toBe(VIEWSHED_VISIBLE);
    expect(cellAt(viewshed, -150, 5)).toBe(VIEWSHED_VISIBLE);
    expect(cellAt(viewshed, 200, 5)).toBe(VIEWSHED_HIDDEN);
    expect(cellAt(viewshed, 245, 245)).toBe(VIEWSHED_OUTSIDE);
  });

  it("hides cells behind a building box", () => {
    const viewshed = computeViewshed({ ...input, buildings: [{ min: [60, -20, 0], max: [70, 20, 15] }] }, () => 0)!;
    expect(cellAt(viewshed, 150, 5)).toBe(VIEWSHED_HIDDEN);
    expect(cellAt(viewshed, -150, 5)).toBe(VIEWSHED_VISIBLE);
  });

  it("reports progress up to 1", () => {
    const progress: number[] = [];
    computeViewshed(
      input,
      () => 0,
      (fraction) => progress.push(fraction),
    );
    expect(progress.at(-1)).toBe(1);
    expect(progress).toEqual([...progress].sort((a, b) => a - b));
  });

  it("caps the radius at 1,000 m and has no result off the heightmap", () => {
    expect(computeViewshed({ ...input, radius: 5000, cellSize: 100 }, () => 0)!.radius).toBe(1000);
    expect(computeViewshed(input, () => null)).toBeNull();
  });
});
