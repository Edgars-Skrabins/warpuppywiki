import { describe, expect, it } from "vitest";
import { runLos, sightHeightAt, type LosBox, type LosInputs } from "./losModel";

const flat = () => 0;
const ridge = (x: number) => (x >= 240 && x <= 260 ? 20 : 0);

const inputs: LosInputs = {
  observer: [0, 0],
  target: [500, 0],
  eyeHeight: 1.68,
  targetHeight: 1.68,
  includeBuildings: true,
  path: "direct",
  apex: 300,
};

const house: LosBox = { id: "h1", label: "House", min: [100, -5, 0], max: [110, 5, 10] };

describe("runLos", () => {
  it("is clear over flat ground", () => {
    const result = runLos(inputs, flat, [])!;
    expect(result.clear).toBe(true);
    expect(result.obstruction).toBeNull();
    expect(result.length).toBe(500);
    expect(result.observerZ).toBeCloseTo(1.68);
  });

  it("is blocked by a ridge at the near edge of the ridge", () => {
    const result = runLos(inputs, ridge, [])!;
    expect(result.clear).toBe(false);
    expect(result.obstruction).toMatchObject({ kind: "terrain", label: "Terrain" });
    expect(result.obstruction!.distance).toBeCloseTo(240, 0);
  });

  it("is blocked by a building box, and not when buildings are left out", () => {
    const result = runLos(inputs, flat, [house])!;
    expect(result.obstruction).toMatchObject({ kind: "building", label: "House" });
    expect(result.obstruction!.distance).toBeCloseTo(100, 1);
    expect(result.buildings).toEqual([{ id: "h1", label: "House", from: 100, to: 110, top: 10 }]);
    expect(runLos({ ...inputs, includeBuildings: false }, flat, [house])!.clear).toBe(true);
  });

  it("clears with an indirect arc a ridge that blocks the direct line", () => {
    const result = runLos({ ...inputs, path: "indirect" }, ridge, [])!;
    expect(result.clear).toBe(true);
    expect(Math.max(...result.profile.map((sample) => sample.sight))).toBeGreaterThan(290);
  });

  it("gives the ground and sight height along the profile", () => {
    const result = runLos(inputs, ridge, [])!;
    const atRidge = result.profile.find((sample) => sample.distance >= 250)!;
    expect(atRidge.ground).toBe(20);
    expect(atRidge.sight).toBeCloseTo(1.68);
    expect(result.profile[0]!.distance).toBe(0);
    expect(result.profile.at(-1)!.distance).toBe(500);
  });

  it("has no result when an end is off the heightmap", () => {
    expect(runLos(inputs, (x) => (x > 400 ? null : 0), [])).toBeNull();
  });
});

describe("sightHeightAt", () => {
  it("interpolates along the path", () => {
    expect(
      sightHeightAt(
        [
          [0, 0, 0],
          [5, 0, 10],
          [10, 0, 0],
        ],
        0.25,
      ),
    ).toBe(5);
  });
});
