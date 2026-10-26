import { describe, expect, it } from "vitest";
import { z } from "zod";
import { encodeBase64Url } from "./base64url";
import { MAX_URL_STATE_LENGTH, StateTooLargeError, decodeState, defineUrlState, encodeState } from "./urlCodec";

const loadout = defineUrlState({
  key: "l",
  version: 1,
  schema: z.object({ weapon: z.string(), attachments: z.array(z.string()) }),
  defaults: { weapon: "", attachments: [] },
});

const state = { weapon: "WP_AK74", attachments: ["Muzzle_PBS4", "Scope_PSO1"] };

describe("urlCodec", () => {
  it("round-trips state through a versioned payload", () => {
    const text = encodeState(loadout, state);
    expect(text).toMatch(/^1\.[A-Za-z0-9_-]+$/);
    expect(decodeState(loadout, text)).toEqual({ state, error: false });
  });

  it("returns defaults without an error when there is no payload", () => {
    expect(decodeState(loadout, null)).toEqual({ state: loadout.defaults, error: false });
    expect(decodeState(loadout, "")).toEqual({ state: loadout.defaults, error: false });
  });

  it("returns defaults with an error for an unknown version", () => {
    const text = encodeState(loadout, state).replace(/^1\./, "7.");
    expect(decodeState(loadout, text)).toEqual({ state: loadout.defaults, error: true });
  });

  it("returns defaults with an error for a payload that fails the schema", () => {
    const text = encodeState({ ...loadout, schema: z.unknown() }, { weapon: 3 });
    expect(decodeState(loadout, text)).toEqual({ state: loadout.defaults, error: true });
  });

  it("returns defaults with an error for text that is not a payload", () => {
    for (const text of ["garbage", "1.", "1.!!!", "1.abcd", `1.${encodeBase64Url(new Uint8Array([1, 2, 3]))}`]) {
      expect(decodeState(loadout, text)).toEqual({ state: loadout.defaults, error: true });
    }
  });

  it("migrates a v1 payload to v2", () => {
    const v2 = defineUrlState({
      key: "l",
      version: 2,
      schema: z.object({ primary: z.object({ weapon: z.string(), attachments: z.array(z.string()) }) }),
      defaults: { primary: { weapon: "", attachments: [] } },
      migrate: { 1: (old) => ({ primary: old }) },
    });
    expect(decodeState(v2, encodeState(loadout, state))).toEqual({ state: { primary: state }, error: false });
  });

  it("returns defaults with an error for an old version without a migration", () => {
    const v2 = { ...loadout, version: 2 };
    expect(decodeState(v2, encodeState(loadout, state))).toEqual({ state: loadout.defaults, error: true });
  });

  it("throws StateTooLargeError above the length limit", () => {
    let seed = 1;
    const random = () => (seed = (seed * 48271) % 2147483647).toString(36);
    const big = { weapon: "WP_AK74", attachments: Array.from({ length: 400 }, random) };
    expect(() => encodeState(loadout, big)).toThrow(StateTooLargeError);
    try {
      encodeState(loadout, big);
    } catch (error) {
      expect((error as StateTooLargeError).length).toBeGreaterThan(MAX_URL_STATE_LENGTH);
    }
  });
});
