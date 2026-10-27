import { describe, expect, it } from "vitest";
import { decodeState, encodeState } from "@/core/state";
import { recoilLink, ttkLink, ttkMatchup, ttkMatchupCodec, type TtkMatchup } from "./links";

const CONTRACT_MATCHUP: TtkMatchup = {
  weaponId: "Id.Item.M4",
  ammoType: "FMJ",
  magazineId: null,
  distance: 100,
  placement: "upper-chest",
  custom: [],
  health: 100,
  bodyArmorId: "Id.Item.MediumArmor",
  helmetId: "Id.Item.LightHelmet",
  condition: 1,
  pellets: 6,
};

const CONTRACT_PARAM =
  "1.VY4xC8IwEEb_y81RKohDNxexYjc3cYjJ0QRySWguSBX_u9fi0vXx3nf3gRfqnGJnoYXObjtG2vZ7UKCJ0m3KKPzUXwSQHvTbR5zVWENQYH1hHY0ou6ZRkIM2SBhZkpozjhvjsLCkphZOBO39ocChDuz-yTPZ6ThSGtf30fpKC5fYYSDklXD1g-Pzwuf1FK1nn6KMyhcYAnKB9vD9AQ";

describe("TTK link contract", () => {
  it("encodes the contract matchup to the committed m parameter", () => {
    expect(ttkMatchupCodec.key).toBe("m");
    expect(ttkMatchupCodec.version).toBe(1);
    expect(encodeState(ttkMatchupCodec, CONTRACT_MATCHUP)).toBe(CONTRACT_PARAM);
    expect(decodeState(ttkMatchupCodec, CONTRACT_PARAM)).toEqual({ state: CONTRACT_MATCHUP, error: false });
  });
});

describe("ttkLink", () => {
  it("opens the TTK calculator with the weapon, FMJ, 50 m and no armor", () => {
    const link = ttkLink("Id.Item.AK74M");
    expect(link.startsWith("/ttk?m=")).toBe(true);
    const param = new URLSearchParams(link.slice(link.indexOf("?"))).get("m");
    expect(decodeState(ttkMatchupCodec, param).state).toEqual(ttkMatchup("Id.Item.AK74M"));
    expect(ttkMatchup("Id.Item.AK74M")).toMatchObject({ ammoType: "FMJ", distance: 50, placement: "upper-chest" });
  });
});

describe("recoilLink", () => {
  it("passes the weapon id as w", () => {
    expect(recoilLink("Id.Item.AK74M")).toBe("/recoil?w=Id.Item.AK74M");
  });
});
