import { describe, expect, it } from "vitest";
import { ballisticArc, firstObstruction, lineOfSight, segmentBoxEntry } from "./lineOfSight";
import type { Box, HeightFn } from "./types";

const box: Box = { min: [10, -5, 0], max: [20, 5, 10] };
const flat: HeightFn = () => 0;
const ridge: HeightFn = (x) => (x >= 49 && x <= 51 ? 20 : 0);

describe("segmentBoxEntry", () => {
  it("returns the fraction where the segment enters the box", () => {
    expect(segmentBoxEntry([0, 0, 5], [40, 0, 5], box)).toBeCloseTo(0.25, 12);
  });

  it("returns null when the segment misses the box", () => {
    expect(segmentBoxEntry([0, 0, 15], [40, 0, 15], box)).toBeNull();
    expect(segmentBoxEntry([0, 10, 5], [40, 10, 5], box)).toBeNull();
    expect(segmentBoxEntry([0, 0, 5], [8, 0, 5], box)).toBeNull();
  });

  it("returns 0 when the segment starts inside the box", () => {
    expect(segmentBoxEntry([15, 0, 5], [40, 0, 5], box)).toBe(0);
  });
});

describe("firstObstruction and lineOfSight", () => {
  it("keeps a line above flat ground clear", () => {
    expect(lineOfSight([0, 0, 1.6], [100, 0, 1.6], { terrain: flat })).toBe(true);
    expect(
      firstObstruction(
        [
          [0, 0, 1.6],
          [100, 0, 1.6],
        ],
        { terrain: flat },
      ),
    ).toBeNull();
  });

  it("is blocked by a raised ridge", () => {
    const obstruction = firstObstruction(
      [
        [0, 0, 1.6],
        [100, 0, 1.6],
      ],
      { terrain: ridge, step: 1 },
    );
    expect(obstruction).toMatchObject({ kind: "terrain", distance: 49 });
    expect(obstruction?.point).toEqual([49, 0, 1.6]);
    expect(lineOfSight([0, 0, 1.6], [100, 0, 1.6], { terrain: ridge, step: 1 })).toBe(false);
  });

  it("can miss a ridge narrower than the step", () => {
    expect(lineOfSight([0, 0, 1.6], [100, 0, 1.6], { terrain: ridge })).toBe(false);
    expect(lineOfSight([0, 0, 1.6], [100, 0, 1.6], { terrain: ridge, step: 4 })).toBe(true);
  });

  it("reports the building that blocks the line", () => {
    const obstruction = firstObstruction(
      [
        [0, 0, 5],
        [40, 0, 5],
      ],
      { buildings: [{ ...box, id: "house" }] },
    );
    expect(obstruction).toEqual({ kind: "building", point: [10, 0, 5], distance: 10, buildingId: "house" });
  });

  it("returns the nearest of several obstructions", () => {
    const far: Box & { id: string } = { min: [60, -5, 0], max: [70, 5, 10], id: "far" };
    const near: Box & { id: string } = { min: [30, -5, 0], max: [35, 5, 10], id: "near" };
    const obstruction = firstObstruction(
      [
        [0, 0, 5],
        [100, 0, 5],
      ],
      { buildings: [far, near], terrain: ridge, step: 1 },
    );
    expect(obstruction?.buildingId).toBe("near");
  });

  it("ignores buildings whose ground rectangle is away from the line", () => {
    const aside: Box = { min: [10, 50, 0], max: [20, 60, 10] };
    expect(lineOfSight([0, 0, 5], [40, 0, 5], { buildings: [aside] })).toBe(true);
  });

  it("ignores ground without heightmap data", () => {
    expect(lineOfSight([0, 0, -50], [100, 0, -50], { terrain: () => null })).toBe(true);
  });

  it("ignores obstructions within the endpoint margin", () => {
    const slope: HeightFn = (x) => (x > 99 ? 2 : 0);
    expect(lineOfSight([0, 0, 1.6], [100, 0, 1.6], { terrain: slope, step: 0.5 })).toBe(true);
    expect(lineOfSight([0, 0, 1.6], [100, 0, 1.6], { terrain: slope, step: 0.5, endpointMargin: 0 })).toBe(false);
  });

  it("follows a polyline path such as an arc", () => {
    const arc = ballisticArc([0, 0, 0], [100, 0, 0], 50, 32);
    expect(firstObstruction(arc, { terrain: ridge, step: 1 })).toBeNull();
    expect(firstObstruction(arc, { buildings: [{ min: [45, -5, 0], max: [55, 5, 60] }] })?.kind).toBe("building");
  });
});

describe("ballisticArc", () => {
  it("peaks apexRise above the higher end", () => {
    const arc = ballisticArc([0, 0, 10], [200, 0, 40], 25, 400);
    const apex = Math.max(...arc.map((p) => p[2]));
    expect(apex).toBeCloseTo(65, 2);
  });

  it("starts and ends exactly at the given points", () => {
    const from = [0, 0, 10] as const;
    const to = [200, 50, 40] as const;
    const arc = ballisticArc(from, to, 25, 16);
    expect(arc).toHaveLength(17);
    expect(arc[0]).toBe(from);
    expect(arc[16]).toBe(to);
  });

  it("rejects a negative rise and too few segments", () => {
    expect(() => ballisticArc([0, 0, 0], [1, 0, 0], -1)).toThrow();
    expect(() => ballisticArc([0, 0, 0], [1, 0, 0], 1, 1)).toThrow();
  });
});
