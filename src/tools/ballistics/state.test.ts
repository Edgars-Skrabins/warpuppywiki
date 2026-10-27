import { describe, expect, it } from "vitest";
import { decodeState, encodeState } from "@/core/state";
import { ballisticsState, type BallisticsState } from "./state";

describe("ballisticsState", () => {
  it("opens a v1 link with the sight and zero ignored", () => {
    const old = {
      primary: { weapon: "WEPN_SV98", ammo: "Item.Caliber.762x54mm", sight: "Sight.Scope", zero: 300 },
      comparison: { weapon: "WEPN_AK74M", ammo: null, sight: null, zero: 100 },
      maxDistance: 1000,
    };
    const text = encodeState({ ...ballisticsState, version: 1 } as never, old);
    expect(decodeState(ballisticsState, text)).toEqual({
      state: {
        primary: { weapon: "WEPN_SV98", ammo: "Item.Caliber.762x54mm" },
        comparison: { weapon: "WEPN_AK74M", ammo: null },
        maxDistance: 1000,
        targetSpeed: null,
      },
      error: false,
    });
  });

  it("keeps a typed target speed", () => {
    const state: BallisticsState = {
      primary: { weapon: "WEPN_SV98", ammo: null },
      comparison: null,
      maxDistance: null,
      targetSpeed: 7,
    };
    expect(decodeState(ballisticsState, encodeState(ballisticsState, state))).toEqual({ state, error: false });
  });
});
