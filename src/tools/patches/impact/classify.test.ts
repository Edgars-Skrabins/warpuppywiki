import { describe, expect, it } from "vitest";
import { classify, impactRule } from "./classify";

describe("classify", () => {
  it("labels an RPM increase as a buff", () => {
    expect(classify("weapons", { path: "rpm", kind: "changed", before: 700, after: 750 })).toBe("buff");
  });

  it("labels a longer ADS time as a nerf", () => {
    expect(classify("weapons", { path: "adsTime", kind: "changed", before: 0.3, after: 0.35 })).toBe("nerf");
  });

  it("labels a lower price as a buff in any item category", () => {
    const change = { path: "vendor[Id.Item.AK74M].price", kind: "changed", before: 3000, after: 2800 } as const;
    expect(classify("weapons", change)).toBe("buff");
    expect(classify("items", change)).toBe("buff");
    expect(classify("vehicles", change)).toBe("neutral");
  });

  it("labels a higher unlock level as a nerf", () => {
    expect(classify("attachments", { path: "unlock.level", kind: "changed", before: 4, after: 6 })).toBe("nerf");
  });

  it("labels a larger infantry rule amount by its effect", () => {
    const change = { path: "amount", kind: "changed", before: -75, after: -50 } as const;
    expect(classify("damage", change, "rule:infantry|bone|percentage_ongoing|bullet|||infantry")).toEqual({
      label: "More damage to infantry",
    });
    expect(classify("damage", { ...change, before: -50, after: -75 }, "rule:infantry|bone")).toEqual({
      label: "Less damage to infantry",
    });
    expect(classify("damage", change, "rule:armor|armor|percentage_ongoing")).toBe("neutral");
  });

  it("keeps unknown, neutral and non-numeric changes neutral", () => {
    expect(classify("weapons", { path: "fireModes[]", kind: "added", after: "Burst" })).toBe("neutral");
    expect(classify("weapons", { path: "suppressionMultiplier", kind: "changed", before: 1, after: 1.2 })).toBe(
      "neutral",
    );
    expect(classify("weapons", { path: "rpm", kind: "changed", before: null, after: 700 })).toBe("neutral");
    expect(classify("weapons", { path: "rpm", kind: "added", after: 700 })).toBe("neutral");
  });

  it("matches array keys and indexes in rule paths", () => {
    expect(impactRule("weapons", "damageFalloff[50].multiplier")).toBe("higher");
    expect(impactRule("armor", "stages[#2].damageReduction")).toBe("higher");
    expect(impactRule("weapons", "recoil.pattern")).toBeNull();
  });
});
