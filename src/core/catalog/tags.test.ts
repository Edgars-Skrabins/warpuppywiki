import { describe, expect, it } from "vitest";
import { hasTag, stripPrefix, tagMatches, tagsUnder } from "./tags";

describe("tagMatches", () => {
  it("matches a sub-tag against its parent", () => {
    expect(tagMatches("Item.Attachment.Sight.Short.X", "Item.Attachment.Sight.Short")).toBe(true);
    expect(tagMatches("Item.Attachment.Sight.Short", "Item.Attachment.Sight.Short")).toBe(true);
  });

  it("does not match a tag that only shares a prefix of a segment", () => {
    expect(tagMatches("Item.Attachment.SightX", "Item.Attachment.Sight")).toBe(false);
  });

  it("does not match a parent against a sub-tag query", () => {
    expect(tagMatches("Item.Attachment.Sight", "Item.Attachment.Sight.Short")).toBe(false);
  });

  it("ignores case", () => {
    expect(tagMatches("ITEM.attachment.Sight.Short", "item.Attachment.SIGHT")).toBe(true);
  });
});

describe("tag lists", () => {
  const tags = ["Inventory.Slot.Primary", "Inventory.Slot.Secondary", "Item.Archetype.AR", "Inventory.Slot"];

  it("finds a tag or its parent in a list", () => {
    expect(hasTag(tags, "item.archetype")).toBe(true);
    expect(hasTag(tags, "Item.Weapon")).toBe(false);
  });

  it("lists the tags under a prefix in order, without the prefix itself", () => {
    expect(tagsUnder(tags, "inventory.slot")).toEqual(["Inventory.Slot.Primary", "Inventory.Slot.Secondary"]);
  });

  it("strips a prefix case-insensitively and keeps the rest as written", () => {
    expect(stripPrefix("Inventory.Slot.Vehicle.Turret", "inventory.slot")).toBe("Vehicle.Turret");
    expect(stripPrefix("Item.Archetype.AR", "Inventory.Slot")).toBe("Item.Archetype.AR");
  });
});
