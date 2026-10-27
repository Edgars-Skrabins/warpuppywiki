import { describe, expect, it } from "vitest";
import { sameId } from "@/core/catalog";
import type { Weapon } from "@/core/data";
import { WeaponsFile } from "@/core/data/schemas/weapons";
import weaponsJson from "@/test/fixtures/data/25937608/weapons.json";
import { gridTicks, mirrorPath, recoilPath, squareFrame, unionBounds } from "./recoilPath";

const weapons = WeaponsFile.parse(weaponsJson).weapons;

function weapon(id: string): Weapon {
  const found = weapons.find((candidate) => sameId(candidate.id, id));
  if (found === undefined) {
    throw new Error(`No fixture weapon ${id}`);
  }
  return found;
}

const ak = weapon("Id.Item.AK74M");
const pattern = ak.recoil?.pattern ?? [];
const pitch = ak.recoil?.afterPatternPitch ?? null;
const yaw = ak.recoil?.afterPatternYaw ?? null;
const unit = { vertical: 1, horizontal: 1 };

describe("recoilPath", () => {
  it("draws the AK74 pattern as 30 points ending at the pattern's sum", () => {
    const { points, cone } = recoilPath(pattern, unit, 30, pitch, yaw);
    expect(points).toHaveLength(30);
    expect(points.map((point) => point.shot)).toEqual(Array.from({ length: 30 }, (_, index) => index + 1));
    const last = points[29]!;
    expect(last.x).toBeCloseTo(
      pattern.reduce((sum, kick) => sum + kick.x, 0),
      9,
    );
    expect(last.y).toBeCloseTo(
      pattern.reduce((sum, kick) => sum + kick.y, 0),
      9,
    );
    expect(last.x).toBeCloseTo(0.62, 6);
    expect(last.y).toBeCloseTo(32.459341, 6);
    expect(cone).toBeNull();
  });

  it("scales x by the horizontal and y by the vertical multiplier", () => {
    const base = recoilPath(pattern, unit, 30, pitch, yaw).points;
    const scaled = recoilPath(pattern, { vertical: 1.19, horizontal: 1.21 }, 30, pitch, yaw).points;
    for (const [index, point] of scaled.entries()) {
      expect(point.x).toBeCloseTo(base[index]!.x * 1.21, 9);
      expect(point.y).toBeCloseTo(base[index]!.y * 1.19, 9);
    }
  });

  it("adds a min/max cone for shots beyond the pattern", () => {
    const { points, cone } = recoilPath(pattern, unit, 60, pitch, yaw);
    expect(points).toHaveLength(30);
    expect(cone).not.toBeNull();
    const { lower, upper } = cone!;
    expect(lower).toHaveLength(31);
    expect(upper).toHaveLength(31);
    expect(lower[0]!).toEqual({ x: points[29]!.x, y: points[29]!.y });
    expect(lower[1]!.x).toBeCloseTo(0.62 - 0.28, 6);
    expect(lower[1]!.y).toBeCloseTo(32.459341 + 0.45, 6);
    expect(upper[1]!.x).toBeCloseTo(0.62 + 0.28, 6);
    expect(upper[1]!.y).toBeCloseTo(32.459341 + 0.75, 6);
    expect(lower[30]!.x).toBeCloseTo(0.62 - 30 * 0.28, 6);
    expect(lower[30]!.y).toBeCloseTo(32.459341 + 30 * 0.45, 6);
    expect(upper[30]!.x).toBeCloseTo(0.62 + 30 * 0.28, 6);
    expect(upper[30]!.y).toBeCloseTo(32.459341 + 30 * 0.75, 6);
  });

  it("scales the cone by the multipliers", () => {
    const { cone } = recoilPath(pattern, { vertical: 2, horizontal: 3 }, 31, pitch, yaw);
    const start = cone!.lower[0]!;
    expect(cone!.upper[1]!.x - start.x).toBeCloseTo(0.28 * 3, 9);
    expect(cone!.upper[1]!.y - start.y).toBeCloseTo(0.75 * 2, 9);
  });

  it("truncates the path when the capacity is below the pattern length", () => {
    const { points, cone } = recoilPath(pattern, unit, 20, pitch, yaw);
    expect(points).toHaveLength(20);
    expect(cone).toBeNull();
  });

  it("draws the whole pattern without a cone when there is no magazine", () => {
    expect(recoilPath(pattern, unit, null, pitch, yaw).points).toHaveLength(30);
  });

  it("gives no points and no cone for an empty pattern", () => {
    const path = recoilPath([], unit, 5, [0.5, 1], [-0.5, 0.5]);
    expect(path.points).toEqual([]);
    expect(path.cone).toBeNull();
    expect(path.bounds).toEqual({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
  });

  it("bounds the origin, the path and the cone", () => {
    const { bounds } = recoilPath(pattern, unit, 60, pitch, yaw);
    expect(bounds.minY).toBe(0);
    expect(bounds.maxY).toBeCloseTo(32.459341 + 30 * 0.75, 6);
    expect(bounds.minX).toBeCloseTo(0.62 - 30 * 0.28, 6);
    expect(bounds.maxX).toBeCloseTo(0.62 + 30 * 0.28, 6);
  });
});

describe("mirrorPath", () => {
  it("negates points, cone and bounds", () => {
    const path = recoilPath(pattern, unit, 60, pitch, yaw);
    const mirrored = mirrorPath(path);
    expect(mirrored.points[29]!.y).toBeCloseTo(-path.points[29]!.y, 9);
    expect(mirrored.points[29]!.shot).toBe(30);
    expect(mirrored.cone!.upper[30]!.x).toBeCloseTo(-path.cone!.upper[30]!.x, 9);
    expect(mirrored.bounds.minY).toBeCloseTo(-path.bounds.maxY, 9);
    expect(mirrored.bounds.maxY).toBe(-0);
  });
});

describe("unionBounds", () => {
  it("covers every bound and the origin", () => {
    expect(
      unionBounds([
        { minX: -1, maxX: 2, minY: 1, maxY: 3 },
        { minX: -4, maxX: 1, minY: 2, maxY: 5 },
      ]),
    ).toEqual({ minX: -4, maxX: 2, minY: 0, maxY: 5 });
  });
});

describe("squareFrame", () => {
  it("is square, centred on x = 0 and keeps an upward path above the origin", () => {
    const frame = squareFrame({ minX: -2, maxX: 5, minY: 0, maxY: 30 });
    expect(frame.maxX - frame.minX).toBeCloseTo(frame.maxY - frame.minY, 9);
    expect(frame.minX).toBeCloseTo(-frame.maxX, 9);
    expect(frame.maxX).toBeGreaterThanOrEqual(5);
    expect(frame.minY).toBeLessThanOrEqual(0);
    expect(frame.maxY).toBeGreaterThanOrEqual(30);
    expect(-frame.minY).toBeLessThan(frame.maxY - 30 + 1e-9);
  });

  it("puts a downward path below the origin", () => {
    const frame = squareFrame({ minX: -5, maxX: 2, minY: -30, maxY: 0 });
    expect(frame.maxY).toBeGreaterThanOrEqual(0);
    expect(frame.minY).toBeLessThanOrEqual(-30);
  });

  it("keeps a minimum size for an empty path", () => {
    const frame = squareFrame({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
    expect(frame.maxX - frame.minX).toBeGreaterThan(0);
  });
});

describe("gridTicks", () => {
  it("returns round steps across the range", () => {
    expect(gridTicks(-10, 10, 4)).toEqual([-10, -5, 0, 5, 10]);
    expect(gridTicks(0, 1, 5)).toEqual([0, 0.2, 0.4, 0.6000000000000001, 0.8, 1]);
  });
});
