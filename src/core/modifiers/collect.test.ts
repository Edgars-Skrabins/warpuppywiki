import { describe, expect, it } from "vitest";
import { collect } from "./collect";

describe("collect", () => {
  it("keeps only the asked attribute, case-insensitively, with source labels in source order", () => {
    const sources = [
      {
        label: "Spitfire 3X",
        modifiers: [
          { attribute: "Weapon.AimTime", op: "multiplyCompound" as const, value: 1.15 },
          { attribute: "Weapon.AdsZoomMultiplier", op: "override" as const, value: 3 },
        ],
      },
      { label: "Light armor", modifiers: [] },
      {
        label: "Angled grip",
        modifiers: [
          { attribute: "weapon.aimtime", op: "multiply" as const, value: 0.9 },
          { attribute: "Weapon.VerticalRecoilMultiplier", op: "multiplyCompound" as const, value: 1.05 },
          { attribute: "WEAPON.AIMTIME", op: "add" as const, value: 0.01 },
        ],
      },
    ];

    expect(collect(sources, "Weapon.AimTime")).toEqual([
      { source: "Spitfire 3X", modifier: { attribute: "Weapon.AimTime", op: "multiplyCompound", value: 1.15 } },
      { source: "Angled grip", modifier: { attribute: "weapon.aimtime", op: "multiply", value: 0.9 } },
      { source: "Angled grip", modifier: { attribute: "WEAPON.AIMTIME", op: "add", value: 0.01 } },
    ]);
  });

  it("returns nothing when no source has the attribute", () => {
    expect(collect([{ label: "Grip", modifiers: [] }], "Weapon.AimTime")).toEqual([]);
  });
});
