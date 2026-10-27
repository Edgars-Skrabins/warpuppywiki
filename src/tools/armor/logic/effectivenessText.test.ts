import { describe, expect, it } from "vitest";
import { fixtureDamage } from "../fixtures/testData";
import { effectivenessRows, effectivenessSentence } from "./effectivenessText";

const LABELS: Record<string, string> = { FMJ: "FMJ", HollowPoint: "HP", ArmorPiercing: "AP" };

const rows = effectivenessRows(fixtureDamage.ammoTypes, (ammoType) => LABELS[ammoType] ?? ammoType);

function row(ammoType: string) {
  const found = rows.find((candidate) => candidate.ammoType === ammoType);
  if (!found) throw new Error(`No row ${ammoType}`);
  return found;
}

describe("effectivenessSentence", () => {
  it("describes weakening, strengthening and no change", () => {
    expect(effectivenessSentence("AP", 0.6, "medium-caliber weapons")).toBe(
      "AP weakens armor to 60% of its reduction against medium-caliber weapons.",
    );
    expect(effectivenessSentence("HP", 1.5)).toBe("HP strengthens armor to 150% of its reduction.");
    expect(effectivenessSentence("FMJ", 1)).toBe("FMJ leaves armor at its full reduction.");
  });
});

describe("effectivenessRows", () => {
  it("has one row per ammo type in file order", () => {
    expect(rows.map((entry) => entry.ammoType)).toEqual(fixtureDamage.ammoTypes.map((entry) => entry.ammoType));
  });

  it("explains ammo types without arms-class values in one line", () => {
    expect(row("FMJ").lines).toEqual(["FMJ leaves armor at its full reduction."]);
    expect(row("HollowPoint").lines).toEqual(["HP strengthens armor to 150% of its reduction."]);
    expect(row("HollowPoint").byArmsClass).toEqual({ Small: null, Medium: null, High: null, Special: null });
  });

  it("explains AP per arms class", () => {
    const ap = row("ArmorPiercing");
    expect(ap.modifier).toBe(0.3);
    expect(ap.byArmsClass).toEqual({ Small: 0.7, Medium: 0.6, High: 0.5, Special: 1 });
    expect(ap.lines).toEqual([
      "AP weakens armor to 70% of its reduction against small-caliber weapons.",
      "AP weakens armor to 60% of its reduction against medium-caliber weapons.",
      "AP weakens armor to 50% of its reduction against high-caliber weapons.",
      "AP leaves armor at its full reduction against special weapons.",
    ]);
  });

  it("adds the default for arms classes the data leaves out", () => {
    const [partial] = effectivenessRows(
      [{ ammoType: "ArmorPiercing", modifier: 0.3, byArmsClass: { Medium: 0.6 } }],
      () => "AP",
    );
    expect(partial?.lines).toEqual([
      "AP weakens armor to 60% of its reduction against medium-caliber weapons.",
      "AP weakens armor to 30% of its reduction against other weapons.",
    ]);
  });
});
