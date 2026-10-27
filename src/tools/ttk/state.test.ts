import { describe, expect, it } from "vitest";
import { decodeState, encodeState } from "@/core/state";
import {
  DEFAULT_COMPARE,
  DEFAULT_MATCHUP,
  compareCodec,
  matchupCodec,
  setupOf,
  sharedOf,
  type CompareState,
  type MatchupState,
} from "./state";

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

  it("re-encodes a decoded matchup to the same text", () => {
    const text = encodeState(matchupCodec, custom);
    expect(encodeState(matchupCodec, decodeState(matchupCodec, text).state)).toBe(text);
  });

  it("splits a matchup into its setup and shared target", () => {
    expect({ ...setupOf(custom), ...sharedOf(custom) }).toEqual(custom);
  });
});

describe("compare state", () => {
  const comparison: CompareState = {
    shared: sharedOf(custom),
    setups: [
      { weaponId: "Id.Item.AK74M", ammoType: "FMJ", magazineId: null },
      { weaponId: "Id.Item.AK74M", ammoType: "HollowPoint", magazineId: "Id.Item.AK74MExtendedMagazine" },
    ],
  };

  it("round-trips a comparison through the c codec", () => {
    const text = encodeState(compareCodec, comparison);
    expect(text.startsWith("1.")).toBe(true);
    expect(decodeState(compareCodec, text)).toEqual({ state: comparison, error: false });
  });

  it("rejects more than four setups", () => {
    const text = encodeState(compareCodec, { ...comparison, setups: Array(5).fill(comparison.setups[0]) });
    expect(decodeState(compareCodec, text)).toEqual({ state: DEFAULT_COMPARE, error: true });
  });

  it("rejects an empty setup list", () => {
    const text = encodeState(compareCodec, { ...comparison, setups: [] });
    expect(decodeState(compareCodec, text).error).toBe(true);
  });
});
