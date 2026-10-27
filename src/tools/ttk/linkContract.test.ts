import { describe, expect, it } from "vitest";
import { decodeState, encodeState } from "@/core/state";
import { matchupCodec, type MatchupState } from "./state";

const CONTRACT_MATCHUP: MatchupState = {
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
    expect(encodeState(matchupCodec, CONTRACT_MATCHUP)).toBe(CONTRACT_PARAM);
  });

  it("decodes the committed m parameter back to the contract matchup", () => {
    expect(decodeState(matchupCodec, CONTRACT_PARAM)).toEqual({ state: CONTRACT_MATCHUP, error: false });
  });

  it("uses the m key and version 1", () => {
    expect(matchupCodec.key).toBe("m");
    expect(matchupCodec.version).toBe(1);
  });
});
