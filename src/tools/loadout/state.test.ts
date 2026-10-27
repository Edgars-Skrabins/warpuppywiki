import { describe, expect, it } from "vitest";
import { decodeState, encodeState } from "@/core/state";
import { emptyLoadout, setGearQuantity, setSlotItem, type Loadout } from "./model/loadout";
import { loadoutCodec, readLoadoutLink, shareLink, withLoadoutLink } from "./state";

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

  it("ignores the secondary slot of an old link", () => {
    const old = {
      ...emptyLoadout(10_000),
      slots: { ...emptyLoadout(10_000).slots, secondary: { itemId: "Id.Item.M4" } },
    };
    expect(decodeState(codec, encodeState(codec, old as Loadout))).toEqual({
      state: emptyLoadout(10_000),
      error: false,
    });
  });

  it("fills the lethality view with defaults for a link without one", () => {
    const withoutView: Partial<Loadout> = setSlotItem(emptyLoadout(10_000), "primary", "Id.Item.M4");
    delete withoutView.view;
    const decoded = decodeState(codec, encodeState(codec, withoutView as Loadout));
    expect(decoded.error).toBe(false);
    expect(decoded.state.view.lethality).toEqual({
      tab: "weapons",
      targetArmor: 2,
      targetHelmet: 1,
      placement: "upper-chest",
      threatWeaponId: "Id.Item.M4",
      threatAmmoType: null,
      threatPlacement: "upper-chest",
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

describe("loadout link params", () => {
  it("reads and writes the saved id and the shared flag", () => {
    const params = withLoadoutLink(new URLSearchParams("l=1.abc"), { savedId: "save-1", shared: false });
    expect(params.toString()).toBe("l=1.abc&id=save-1");
    expect(readLoadoutLink(params)).toEqual({ savedId: "save-1", shared: false });
    const shared = withLoadoutLink(params, { savedId: null, shared: true });
    expect(shared.toString()).toBe("l=1.abc&shared=1");
    expect(readLoadoutLink(shared)).toEqual({ savedId: null, shared: true });
  });

  it("builds a share link with the encoded loadout and the shared flag", () => {
    const codec = loadoutCodec(10_000);
    const loadout = setSlotItem(emptyLoadout(10_000), "primary", "Id.Item.M4");
    const link = shareLink(codec, loadout, "https://example.test/wiki/#/loadout?l=old&id=x", "/loadout");
    expect(link).toEqual({
      ok: true,
      url: `https://example.test/wiki/#/loadout?l=${encodeState(codec, loadout)}&shared=1`,
    });
  });

  it("reports a loadout that is too large for a link", () => {
    const codec = loadoutCodec(10_000);
    let seed = 7;
    const noise = () =>
      Array.from({ length: 200 }, () => {
        seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
        return (Math.floor(seed / 65_536) % 16).toString(16);
      }).join("");
    const gear = Array.from({ length: 30 }, () => ({ itemId: noise(), quantity: 1 }));
    expect(shareLink(codec, { ...emptyLoadout(10_000), gear }, "https://example.test/", "/loadout")).toEqual({
      ok: false,
      reason: "too-large",
    });
  });
});
