import { describe, expect, it } from "vitest";
import { decodeState, encodeState } from "@/core/state";
import { emptyLoadout, setGearQuantity, setSlotItem, type Loadout } from "./model/loadout";
import { loadoutCodec } from "./state";

describe("loadout URL codec", () => {
  const codec = loadoutCodec(10_000);

  it("round-trips a filled loadout", () => {
    let loadout = setSlotItem(emptyLoadout(25_000), "primary", "Id.Item.M4");
    loadout = setSlotItem(loadout, "armor", "Id.Item.HeavyArmor");
    loadout = setGearQuantity(loadout, "Id.Item.Bandage", 2);
    const encoded = encodeState(codec, loadout);
    expect(encoded.startsWith("1.")).toBe(true);
    expect(decodeState(codec, encoded)).toEqual({ state: loadout, error: false });
  });

  it("decodes a spec 14 link whose weapon setups have only an item id", () => {
    const legacy = {
      ...emptyLoadout(10_000),
      slots: { ...emptyLoadout(10_000).slots, primary: { itemId: "Id.Item.M4" } },
    };
    expect(decodeState(codec, encodeState(codec, legacy as Loadout))).toEqual({
      state: setSlotItem(emptyLoadout(10_000), "primary", "Id.Item.M4"),
      error: false,
    });
  });

  it("defaults to an empty loadout with the starting budget", () => {
    expect(decodeState(codec, null).state).toEqual(emptyLoadout(10_000));
  });

  it("fills a missing name with the default", () => {
    const withoutName: Partial<Loadout> = emptyLoadout(500);
    delete withoutName.name;
    const encoded = encodeState(codec, withoutName as Loadout);
    expect(decodeState(codec, encoded).state.name).toBe("");
  });

  it("falls back to the defaults for an invalid loadout", () => {
    const invalid = { ...emptyLoadout(500), gear: [{ itemId: "Id.Item.Bandage", quantity: 99 }] };
    expect(decodeState(codec, encodeState(codec, invalid))).toEqual({ state: emptyLoadout(10_000), error: true });
  });
});
