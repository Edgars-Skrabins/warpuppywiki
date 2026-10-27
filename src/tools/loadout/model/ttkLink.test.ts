import { describe, expect, it } from "vitest";
import { encodeState } from "@/core/state";
import { buildTtkLink, ttkMatchup, ttkMatchupCodec } from "./ttkLink";

const CONTRACT_MATCHUP = {
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

const CONTRACT_ENCODED =
  "1.VY4xC8IwEEb_y81RKohDNxexYjc3cYjJ0QRySWguSBX_u9fi0vXx3nf3gRfqnGJnoYXObjtG2vZ7UKCJ0m3KKPzUXwSQHvTbR5zVWENQYH1hHY0ou6ZRkIM2SBhZkpozjhvjsLCkphZOBO39ocChDuz-yTPZ6ThSGtf30fpKC5fYYSDklXD1g-Pzwuf1FK1nn6KMyhcYAnKB9vD9AQ";

describe("TTK link contract", () => {
  it("encodes the contract matchup to the TTK calculator's constant", () => {
    const matchup = ttkMatchup({
      weaponId: "Id.Item.M4",
      ammoType: "FMJ",
      magazineId: null,
      placement: "upper-chest",
      bodyArmorId: "Id.Item.MediumArmor",
      helmetId: "Id.Item.LightHelmet",
    });
    expect(matchup).toEqual(CONTRACT_MATCHUP);
    expect(Object.keys(matchup)).toEqual(Object.keys(CONTRACT_MATCHUP));
    expect(encodeState(ttkMatchupCodec, matchup)).toBe(CONTRACT_ENCODED);
  });

  it("builds a hash route into the TTK calculator", () => {
    const link = buildTtkLink({
      weaponId: "Id.Item.M4",
      ammoType: "FMJ",
      magazineId: null,
      placement: "upper-chest",
      bodyArmorId: "Id.Item.MediumArmor",
      helmetId: "Id.Item.LightHelmet",
    });
    expect(link).toBe(`/#/ttk?m=${CONTRACT_ENCODED}`);
  });
});
