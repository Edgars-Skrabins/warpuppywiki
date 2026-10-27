import { describe, expect, it } from "vitest";
import { decodeState, encodeState } from "@/core/state";
import { DEFAULT_MATCHUP, matchupCodec, type MatchupState } from "./state";

const custom: MatchupState = {
  ...DEFAULT_MATCHUP,
  weaponId: "Id.Item.M500",
  ammoType: "Buckshot",
  distance: 15,
  placement: "custom",
  custom: ["Head", "Torso.Upper", "Torso.Upper"],
  health: 150,
  bodyArmorId: "Id.Item.HeavyArmor",
  helmetId: "Id.Item.HeavyHelmet",
  condition: 0.4,
  pellets: 9,
};

describe("matchup state", () => {
  it("round-trips a matchup through the m codec", () => {
    const text = encodeState(matchupCodec, custom);
    expect(text.startsWith("1.")).toBe(true);
    expect(decodeState(matchupCodec, text)).toEqual({ state: custom, error: false });
  });

  it("round-trips the defaults", () => {
    expect(decodeState(matchupCodec, encodeState(matchupCodec, DEFAULT_MATCHUP)).state).toEqual(DEFAULT_MATCHUP);
  });

  it("rejects values outside the schema and falls back to the defaults", () => {
    const text = encodeState(matchupCodec, { ...custom, distance: 1500 });
    expect(decodeState(matchupCodec, text)).toEqual({ state: DEFAULT_MATCHUP, error: true });
  });
});
