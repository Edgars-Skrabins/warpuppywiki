import { describe, expect, it } from "vitest";
import { fieldLabel, summarizeChange, summarizeChanges } from "./summarize";

describe("summarizeChange", () => {
  it("shows a number change with its percent", () => {
    expect(summarizeChange({ path: "rpm", kind: "changed", before: 700, after: 750 })).toBe("RPM 700 → 750 (+7.1%)");
    expect(summarizeChange({ path: "muzzleVelocity", kind: "changed", before: 900, after: 850 })).toBe(
      "Muzzle velocity 900 → 850 (−5.6%)",
    );
  });

  it("shows a price as cash without a percent", () => {
    expect(summarizeChange({ path: "vendor[Id.Item.AK74M].price", kind: "changed", before: 2800, after: 3000 })).toBe(
      "Price $2,800 → $3,000",
    );
  });

  it("shows a string change", () => {
    expect(summarizeChange({ path: "unlock.role", kind: "changed", before: "Infantry", after: "Recon" })).toBe(
      "Unlock role Infantry → Recon",
    );
  });

  it("shows added and removed fields", () => {
    expect(summarizeChange({ path: "suppressionMultiplier", kind: "added", after: 1.05 })).toBe(
      "Suppression multiplier added: 1.05",
    );
    expect(summarizeChange({ path: "unlock", kind: "changed", before: { level: 3 }, after: null })).toBe(
      "Unlock removed",
    );
  });

  it("names the key of a keyed array entry", () => {
    expect(summarizeChange({ path: "damageFalloff[300].multiplier", kind: "changed", before: 1, after: 0.8 })).toBe(
      "Falloff (300) 1 → 0.8 (−20%)",
    );
  });

  it("falls back to the path for unknown fields", () => {
    expect(fieldLabel("engine.torqueCurve[#0].torque")).toBe("engine.torqueCurve[#0].torque");
  });

  it("summarizes a recoil pattern as one change", () => {
    const before = [
      { x: 0, y: 1 },
      { x: 0.1, y: 1 },
      { x: 0.2, y: 1 },
    ];
    const after = [
      { x: 0, y: 1.1 },
      { x: 0.1, y: 1 },
      { x: 0.2, y: 1.2 },
      { x: 0.3, y: 1 },
    ];
    expect(summarizeChange({ path: "recoil.pattern", kind: "changed", before, after })).toBe(
      "Recoil pattern changed: 3 shots differ",
    );
  });
});

describe("summarizeChanges", () => {
  it("groups set changes into one summary", () => {
    expect(
      summarizeChanges([
        { path: "tags[]", kind: "added", after: "A" },
        { path: "rpm", kind: "changed", before: 600, after: 600.5 },
        { path: "tags[]", kind: "removed", before: "B" },
        { path: "tags[]", kind: "added", after: "C" },
      ]),
    ).toEqual(["+2 tags, −1 tag", "RPM 600 → 600.5 (+0.1%)"]);
  });

  it("keeps the slot key on grouped slot changes", () => {
    expect(summarizeChanges([{ path: "slots[Sight].blockedItems[]", kind: "added", after: "X" }])).toEqual([
      "+1 blocked item (Sight)",
    ]);
  });
});
