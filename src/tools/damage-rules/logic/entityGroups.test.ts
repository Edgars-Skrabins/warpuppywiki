import { describe, expect, it } from "vitest";
import { entityGroup } from "./entityGroups";

describe("entityGroup", () => {
  it.each([
    ["Infantry", "infantry"],
    ["Armor", "armor"],
    ["Helmet.Ghillie", "armor"],
    ["Armor.Ghillie", "armor"],
    ["Vehicle.Air.Rotary.Havoc", "vehicles"],
    ["Vehicle", "vehicles"],
    ["Vehicle.Land.Wheeled.Humvee.Minigun", "vehicles"],
    ["Vehicle.SupplyCrate", "other"],
    ["Vehicle.SupplyCrate.Large.Armoured", "other"],
    ["Buildable.FOB", "buildables"],
    ["buildable.sandbagwall", "buildables"],
    ["Something.Else", "other"],
  ])("puts %s in %s", (entity, group) => {
    expect(entityGroup(entity)).toBe(group);
  });

  it("does not treat a tag that only starts with the same letters as a sub-tag", () => {
    expect(entityGroup("Infantryman")).toBe("other");
  });
});
