import { describe, expect, it } from "vitest";
import { variationLabel } from "./variationLabel";

const magazine = { id: "Id.Item.AK74MMagazine", name: "AK74 30 RND Magazine" };
const ammo = { id: "Id.Item.545mm", name: "5.45mm" };

describe("variationLabel", () => {
  it("labels magazine load suffixes", () => {
    expect(variationLabel("Id.Item.AK74MMagazine.ArmorPiercingTracer", magazine)).toBe("AP (T)");
    expect(variationLabel("Id.Item.AK74MMagazine.HollowPoint", magazine)).toBe("HP");
    expect(variationLabel("Id.Item.AK74MMagazine.FMJTracer", magazine)).toBe("FMJ (T)");
  });

  it("labels dotted ammo suffixes", () => {
    expect(variationLabel("Id.Item.545mm.HollowPoint.Tracer", ammo)).toBe("HP (T)");
    expect(variationLabel("Id.Item.545mm.ArmorPiercing", ammo)).toBe("AP");
    expect(variationLabel("Id.Item.545mm.Tracer", ammo)).toBe("Tracer");
  });

  it("calls the base tag Standard, or the magazine size for magazines", () => {
    expect(variationLabel("Id.Item.545mm", ammo)).toBe("Standard");
    expect(variationLabel("id.item.ak74mmagazine", magazine)).toBe("30 RND");
  });

  it("labels loads sold under another magazine's tag", () => {
    expect(variationLabel("Id.Item.M4Magazine.ArmorPiercing", { id: "ID.Item.A91Mag", name: "A91 Magazine" })).toBe(
      "AP",
    );
  });

  it("falls back to the parts of the tag that are not in the item id", () => {
    const shell = { id: "ID.Item.155mm.Sandbox", name: "155mm" };
    expect(variationLabel("ID.Item.155mm.Expensive.Sandbox", shell)).toBe("Expensive");
  });
});
