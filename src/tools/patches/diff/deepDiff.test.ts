import { describe, expect, it } from "vitest";
import { deepDiff } from "./deepDiff";
import type { DiffOptions } from "./types";

const options: DiffOptions = {
  ignore: ["asset", "gameBuild"],
  keyedArrays: { slots: "slot", damageFalloff: "distance", vendor: "tag" },
  setArrays: true,
  summarize: ["recoil.pattern"],
};

describe("deepDiff", () => {
  it("reports a scalar change", () => {
    expect(deepDiff({ rpm: 700 }, { rpm: 750 }, options)).toEqual([
      { path: "rpm", kind: "changed", before: 700, after: 750 },
    ]);
  });

  it("reports nothing for equal values", () => {
    expect(deepDiff({ rpm: 700, name: "AK-74M" }, { rpm: 700, name: "AK-74M" }, options)).toEqual([]);
  });

  it("reports a nested object change with a dotted path", () => {
    expect(
      deepDiff({ unlock: { role: "Recon", level: 19 } }, { unlock: { role: "Recon", level: 21 } }, options),
    ).toEqual([{ path: "unlock.level", kind: "changed", before: 19, after: 21 }]);
  });

  it("reports added and removed fields", () => {
    expect(deepDiff({ rpm: 700, meleeDamage: 35 }, { rpm: 700, suppressionMultiplier: 1.05 }, options)).toEqual([
      { path: "meleeDamage", kind: "removed", before: 35 },
      { path: "suppressionMultiplier", kind: "added", after: 1.05 },
    ]);
  });

  it("matches keyed arrays by key, ignoring order", () => {
    const before = {
      damageFalloff: [
        { distance: 0, multiplier: 1 },
        { distance: 300, multiplier: 1 },
      ],
    };
    const after = {
      damageFalloff: [
        { distance: 300, multiplier: 0.8 },
        { distance: 0, multiplier: 1 },
        { distance: 1200, multiplier: 0.2 },
      ],
    };
    expect(deepDiff(before, after, options)).toEqual([
      { path: "damageFalloff[300].multiplier", kind: "changed", before: 1, after: 0.8 },
      { path: "damageFalloff[1200]", kind: "added", after: { distance: 1200, multiplier: 0.2 } },
    ]);
  });

  it("matches keys case-insensitively", () => {
    const before = { vendor: [{ tag: "Id.Item.AK74M", price: 2800 }] };
    const after = { vendor: [{ tag: "ID.Item.AK74M", price: 3000 }] };
    expect(deepDiff(before, after, options)).toEqual([
      { path: "vendor[ID.Item.AK74M].price", kind: "changed", before: 2800, after: 3000 },
    ]);
  });

  it("compares string arrays as sets", () => {
    const before = { tags: ["A", "B", "C"] };
    const after = { tags: ["c", "D", "A", "E"] };
    expect(deepDiff(before, after, options)).toEqual([
      { path: "tags[]", kind: "removed", before: "B" },
      { path: "tags[]", kind: "added", after: "D" },
      { path: "tags[]", kind: "added", after: "E" },
    ]);
  });

  it("compares other arrays by position", () => {
    expect(deepDiff({ position: [1, 2, 3] }, { position: [1, 5] }, options)).toEqual([
      { path: "position[#1]", kind: "changed", before: 2, after: 5 },
      { path: "position[#2]", kind: "removed", before: 3 },
    ]);
  });

  it("skips ignored fields at any depth and ignored paths", () => {
    const before = { asset: "a", gameBuild: "1", slots: [{ slot: "Sight", asset: "x", hidden: true }] };
    const after = { asset: "b", gameBuild: "2", slots: [{ slot: "Sight", asset: "y", hidden: true }] };
    expect(deepDiff(before, after, options)).toEqual([]);
    expect(
      deepDiff({ unlock: { level: 1 } }, { unlock: { level: 2 } }, { ...options, ignore: ["unlock.level"] }),
    ).toEqual([]);
  });

  it("reports a summarized path as one change", () => {
    const before = {
      recoil: {
        pattern: [
          { x: 0, y: 1 },
          { x: 0.1, y: 1 },
          { x: 0.2, y: 1 },
        ],
        patternResetTime: 0.78,
      },
    };
    const after = {
      recoil: {
        pattern: [
          { x: 0, y: 1.1 },
          { x: 0.1, y: 1.2 },
          { x: 0.2, y: 1 },
        ],
        patternResetTime: 0.78,
      },
    };
    const changes = deepDiff(before, after, options);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ path: "recoil.pattern", kind: "changed" });
  });

  it("treats numbers within 1e-9 as equal", () => {
    expect(deepDiff({ multiplier: 0.1 + 0.2 }, { multiplier: 0.3 }, options)).toEqual([]);
    expect(deepDiff({ multiplier: 0.3 }, { multiplier: 0.3001 }, options)).toHaveLength(1);
  });

  it("reports a type change as a change", () => {
    expect(deepDiff({ rpm: null }, { rpm: 600 }, options)).toEqual([
      { path: "rpm", kind: "changed", before: null, after: 600 },
    ]);
  });
});
