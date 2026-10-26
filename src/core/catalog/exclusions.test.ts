import { describe, expect, it } from "vitest";
import { nonPlayerReason } from "./exclusions";
import { fixtureItem } from "./fixtures/gameData";

const ak = fixtureItem("Id.Item.AK74M");

describe("nonPlayerReason", () => {
  it("accepts a regular item", () => {
    expect(nonPlayerReason(ak)).toBeNull();
  });

  it("rejects developer items", () => {
    expect(nonPlayerReason(fixtureItem("Id.Item.ArtilleryBarrelTest"))).toBe("developer");
  });

  it("rejects sandbox items regardless of case", () => {
    expect(nonPlayerReason({ ...ak, id: "ID.Item.155mm.SANDBOX" })).toBe("sandbox");
  });

  it("rejects vehicle parts", () => {
    expect(nonPlayerReason({ ...ak, id: "Id.Item.MistralAA", tags: ["Inventory.Slot.Vehicle.Turret"] })).toBe(
      "vehicle-part",
    );
  });

  it("rejects listed items regardless of case", () => {
    expect(nonPlayerReason({ ...ak, id: "ID.Item.CantedIrons" })).toBe("listed");
    expect(nonPlayerReason({ ...ak, id: "Id.Item.LeapordBarrel" })).toBe("listed");
  });
});
