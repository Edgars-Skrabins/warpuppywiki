import { describe, expect, it } from "vitest";
import { encodeState } from "@/core/state";
import { emptyLoadout, setSlotItem } from "../model/loadout";
import type { SavedLoadout } from "../saves/savedLoadouts";
import { loadoutCodec } from "../state";
import { parsePastedLink, parseSideParam, resolveSide, sideParam, type SideContext } from "./sideSource";

const codec = loadoutCodec(10_000);
const current = { ...setSlotItem(emptyLoadout(10_000), "primary", "Id.Item.M4"), name: "Working kit" };
const sniper = { ...setSlotItem(emptyLoadout(10_000), "primary", "Id.Item.SV98"), name: "Sniper kit" };
const saved: SavedLoadout = {
  id: "save-1",
  name: "Sniper kit",
  loadout: sniper,
  createdAt: "2026-10-27T10:00:00.000Z",
  updatedAt: "2026-10-27T10:00:00.000Z",
};
const context: SideContext = { current, saved: [saved], codec, defaultBudget: 10_000 };

describe("side params", () => {
  it("round-trips every kind of side", () => {
    for (const source of [
      { kind: "current" as const },
      { kind: "empty" as const },
      { kind: "saved" as const, id: "save-1" },
      { kind: "link" as const, encoded: "1.abc" },
    ]) {
      expect(parseSideParam(sideParam(source), { kind: "empty" })).toEqual(source);
    }
    expect(parseSideParam(null, { kind: "current" })).toEqual({ kind: "current" });
  });
});

describe("resolveSide", () => {
  it("uses the working loadout for the current side", () => {
    expect(resolveSide({ kind: "current" }, context)).toEqual({ ok: true, loadout: current, label: "Current loadout" });
  });

  it("finds a saved loadout by id and reports a missing one", () => {
    expect(resolveSide({ kind: "saved", id: "save-1" }, context)).toMatchObject({ ok: true, label: "Sniper kit" });
    expect(resolveSide({ kind: "saved", id: "gone" }, context)).toMatchObject({ ok: false, reason: "missing-save" });
  });

  it("reads a loadout from a pasted share link", () => {
    const link = `https://example.test/#/loadout?l=${encodeState(codec, sniper)}&shared=1`;
    const source = parsePastedLink(link, codec);
    expect(source).toEqual({ kind: "link", encoded: encodeState(codec, sniper) });
    expect(source && resolveSide(source, context)).toMatchObject({ ok: true, loadout: { name: "Sniper kit" } });
  });

  it("rejects a link that is not a loadout link", () => {
    expect(parsePastedLink("https://example.test/#/ttk?m=1.abc", codec)).toBeNull();
    expect(parsePastedLink("https://example.test/#/loadout?l=1.not-a-loadout", codec)).toBeNull();
    expect(parsePastedLink("", codec)).toBeNull();
    expect(resolveSide({ kind: "link", encoded: "nonsense" }, context)).toMatchObject({
      ok: false,
      reason: "invalid-link",
    });
  });
});
