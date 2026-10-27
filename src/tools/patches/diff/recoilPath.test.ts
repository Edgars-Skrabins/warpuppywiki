import { describe, expect, it } from "vitest";
import { cumulativeRecoil } from "./recoilPath";

describe("cumulativeRecoil", () => {
  it("sums the per-shot kicks from the origin", () => {
    expect(
      cumulativeRecoil([
        { x: 0, y: 1 },
        { x: 0.5, y: 1 },
      ]),
    ).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0.5, y: 2 },
    ]);
  });

  it("skips malformed shots and returns nothing for a missing pattern", () => {
    expect(cumulativeRecoil([{ x: 1 }, { x: 1, y: 2 }])).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 2 },
    ]);
    expect(cumulativeRecoil(null)).toEqual([]);
    expect(cumulativeRecoil([])).toEqual([]);
  });
});
