import { describe, expect, it } from "vitest";
import { fitsSlot, itemsFittingSlot, type WeaponSlot } from "./fitsSlot";
import { fixtureSlot, fixtureWeapon, itemsFile } from "./fixtures/gameData";

function slot(overrides: Partial<WeaponSlot>): WeaponSlot {
  return {
    slot: "Sight",
    items: [],
    contexts: [],
    filter: "AllowList",
    blockedItems: [],
    blockedContexts: [],
    hidden: false,
    ...overrides,
  };
}

describe("fitsSlot", () => {
  it("fits an item named in the slot", () => {
    expect(fitsSlot({ id: "Id.Item.3xScope", tags: [] }, slot({ items: ["Id.Item.3xScope"] }))).toBe(true);
  });

  it("fits an item whose tag is a sub-tag of a slot context", () => {
    const candidate = { id: "Id.Item.Red", tags: ["Item.Attachment.Sight.Short.RedDot"] };
    expect(fitsSlot(candidate, slot({ contexts: ["Item.Attachment.Sight.Short"] }))).toBe(true);
  });

  it("refuses an item matching neither items nor contexts", () => {
    const candidate = { id: "Id.Item.Red", tags: ["Item.Attachment.SightX"] };
    expect(fitsSlot(candidate, slot({ contexts: ["Item.Attachment.Sight"] }))).toBe(false);
  });

  it("refuses a blocked item even when it is allowed", () => {
    const candidate = { id: "Id.Item.3xScope", tags: ["Item.Attachment.Sight.Medium"] };
    const blocked = slot({
      items: ["Id.Item.3xScope"],
      contexts: ["Item.Attachment.Sight"],
      blockedItems: ["Id.Item.3xScope"],
    });
    expect(fitsSlot(candidate, blocked)).toBe(false);
  });

  it("refuses an item carrying a blocked context even when it is allowed", () => {
    const candidate = {
      id: "Id.Item.Bipod",
      tags: ["Item.Attachment.Underbarrel", "Item.Attachment.Bipod.Attached.X"],
    };
    const blocked = slot({
      items: ["Id.Item.Bipod"],
      contexts: ["Item.Attachment.Underbarrel"],
      blockedContexts: ["Item.Attachment.Bipod.Attached"],
      filter: "BlockPriority",
    });
    expect(fitsSlot(candidate, blocked)).toBe(false);
  });

  it("compares ids and tags case-insensitively", () => {
    expect(fitsSlot({ id: "ID.Item.ar_01_brl_02", tags: [] }, slot({ items: ["ID.Item.AR_01_BRL_02"] }))).toBe(true);
    expect(fitsSlot({ id: "x", tags: ["item.caliber.545MM"] }, slot({ contexts: ["Item.Caliber.545mm"] }))).toBe(true);
  });

  it("finds the 5.45 mm ammo items fitting the AK74 chamber", () => {
    const chamber = fixtureSlot(fixtureWeapon("Id.Item.AK74M"), "Chamber");
    const fitting = itemsFittingSlot(chamber, itemsFile.items).map((item) => item.id);
    expect(fitting).toHaveLength(6);
    expect(fitting.every((id) => id.startsWith("Id.Item.545mm"))).toBe(true);
  });
});
