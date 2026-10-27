import { describe, expect, it } from "vitest";
import { DEFAULT_DIFF_OPTIONS } from "./categories";
import { flattenRecord } from "./flatten";

describe("flattenRecord", () => {
  it("lists scalar fields with keyed and positional array paths", () => {
    const record = {
      id: "Id.Item.M14",
      asset: "Game/M14",
      rpm: 700,
      fireModes: ["Single", "Auto"],
      damageFalloff: [{ distance: 50, multiplier: 0.9 }],
      stages: [{ damageReduction: 0.5 }],
      recoil: { pattern: [{ x: 0, y: 1 }], viewKickMultiplier: null },
    };
    expect(flattenRecord(record, DEFAULT_DIFF_OPTIONS)).toEqual([
      { path: "id", value: "Id.Item.M14" },
      { path: "rpm", value: 700 },
      { path: "fireModes", value: ["Single", "Auto"] },
      { path: "damageFalloff[50].distance", value: 50 },
      { path: "damageFalloff[50].multiplier", value: 0.9 },
      { path: "stages[#0].damageReduction", value: 0.5 },
      { path: "recoil.pattern", value: [{ x: 0, y: 1 }] },
      { path: "recoil.viewKickMultiplier", value: null },
    ]);
  });
});
