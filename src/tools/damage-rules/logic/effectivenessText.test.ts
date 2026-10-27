import { describe, expect, it } from "vitest";
import { damageFile } from "../fixtures/gameData";
import { ammoTypeLabel, effectivenessText } from "./effectivenessText";

function effect(ammoType: string) {
  const found = damageFile.ammoTypes.find((entry) => entry.ammoType === ammoType);
  if (!found) throw new Error(`No ammo type ${ammoType}`);
  return found;
}

describe("effectivenessText", () => {
  it("says plain ammo leaves armor alone", () => {
    expect(effectivenessText(effect("FMJ"))).toBe("FMJ leaves armor at its full reduction.");
  });

  it("says hollow point strengthens armor", () => {
    expect(effectivenessText(effect("HollowPoint.Tracer"))).toBe(
      "Hollow Point Tracer strengthens armor to 150% of its reduction.",
    );
  });

  it("lists the per-arms-class values for armor piercing", () => {
    expect(effectivenessText(effect("ArmorPiercing"))).toBe(
      "Armor Piercing weakens armor to 30% of its reduction by default, 70% against small-caliber weapons, 60% against medium-caliber weapons, 50% against high-caliber weapons and 100% against special-caliber weapons.",
    );
  });
});

describe("ammoTypeLabel", () => {
  it("splits words and sub-tags", () => {
    expect(ammoTypeLabel("ArmorPiercing.Tracer")).toBe("Armor Piercing Tracer");
    expect(ammoTypeLabel("FMJ")).toBe("FMJ");
  });
});
