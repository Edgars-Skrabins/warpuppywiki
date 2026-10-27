import { describe, expect, it } from "vitest";
import { emptyLoadout, setLethalityView, setSlotItem } from "../model/loadout";
import {
  copyName,
  duplicateSaved,
  findSaved,
  MAX_SAVED_LOADOUTS,
  readEntries,
  removeEntry,
  renameSaved,
  sameContent,
  saveAsNew,
  saveLoadout,
  type SaveContext,
  type StoredEntries,
} from "./savedLoadouts";

function context(time: string, ids: string[] = ["id-1", "id-2", "id-3"]): SaveContext {
  const queue = [...ids];
  return { now: new Date(time), newId: () => queue.shift() ?? "id-extra" };
}

const kit = { ...setSlotItem(emptyLoadout(10_000), "primary", "Id.Item.M4"), name: "Assault kit" };

function saved(entries: StoredEntries, id: string) {
  const found = findSaved(entries, id);
  if (found === null) {
    throw new Error(`No saved loadout ${id}`);
  }
  return found;
}

describe("saveLoadout", () => {
  it("creates an entry with an id and timestamps on the first save", () => {
    const result = saveLoadout([], null, kit, context("2026-10-27T10:00:00.000Z"));
    expect(result).toMatchObject({
      ok: true,
      saved: {
        id: "id-1",
        name: "Assault kit",
        createdAt: "2026-10-27T10:00:00.000Z",
        updatedAt: "2026-10-27T10:00:00.000Z",
      },
    });
  });

  it("updates the same entry and its updatedAt on a second save", () => {
    const first = saveLoadout([], null, kit, context("2026-10-27T10:00:00.000Z"));
    if (!first.ok) throw new Error("first save failed");
    const edited = { ...kit, budget: 20_000 };
    const second = saveLoadout(first.entries, "id-1", edited, context("2026-10-27T12:00:00.000Z"));
    if (!second.ok) throw new Error("second save failed");
    expect(second.entries).toHaveLength(1);
    expect(saved(second.entries, "id-1")).toMatchObject({
      createdAt: "2026-10-27T10:00:00.000Z",
      updatedAt: "2026-10-27T12:00:00.000Z",
      loadout: { budget: 20_000 },
    });
  });

  it("refuses the 101st loadout", () => {
    const full: StoredEntries = Array.from({ length: MAX_SAVED_LOADOUTS }, (_, position) => ({ id: `x${position}` }));
    expect(saveLoadout(full, null, kit, context("2026-10-27T10:00:00.000Z"))).toEqual({ ok: false, reason: "limit" });
  });
});

describe("saveAsNew and duplicate", () => {
  it("appends (copy) to the name", () => {
    const result = saveAsNew([], kit, context("2026-10-27T10:00:00.000Z"));
    expect(result.ok && result.saved.name).toBe("Assault kit (copy)");
    expect(result.ok && result.saved.loadout.name).toBe("Assault kit (copy)");
  });

  it("keeps a copied name within 60 characters", () => {
    expect(copyName("x".repeat(60))).toHaveLength(60);
    expect(copyName("")).toBe("Untitled loadout (copy)");
  });

  it("duplicates a saved loadout", () => {
    const first = saveLoadout([], null, kit, context("2026-10-27T10:00:00.000Z"));
    if (!first.ok) throw new Error("first save failed");
    const copy = duplicateSaved(first.entries, "id-1", context("2026-10-27T11:00:00.000Z", ["id-9"]));
    expect(copy?.ok && copy.entries.length).toBe(2);
    expect(copy?.ok && copy.saved).toMatchObject({ id: "id-9", name: "Assault kit (copy)" });
  });
});

describe("rename and remove", () => {
  const first = saveLoadout([], null, kit, context("2026-10-27T10:00:00.000Z"));
  const entries = first.ok ? first.entries : [];

  it("renames an entry and its loadout", () => {
    const renamed = renameSaved(entries, "id-1", "Sniper kit", new Date("2026-10-27T11:00:00.000Z"));
    expect(saved(renamed, "id-1")).toMatchObject({ name: "Sniper kit", loadout: { name: "Sniper kit" } });
  });

  it("deletes an entry", () => {
    expect(removeEntry(entries, "id-1")).toEqual([]);
  });
});

describe("readEntries", () => {
  it("reports an invalid stored entry as unreadable", () => {
    const first = saveLoadout([], null, kit, context("2026-10-27T10:00:00.000Z"));
    const entries = [...(first.ok ? first.entries : []), { id: "old", name: "Old kit", loadout: { version: 0 } }, 42];
    expect(readEntries(entries).map((entry) => [entry.kind, entry.key])).toEqual([
      ["saved", "id-1"],
      ["unreadable", "old"],
      ["unreadable", "#2"],
    ]);
    expect(readEntries(entries)[1]).toMatchObject({ name: "Old kit" });
    expect(removeEntry(entries, "#2")).toHaveLength(2);
  });
});

describe("sameContent", () => {
  it("ignores key order and the panel view but not real edits", () => {
    const reordered = Object.fromEntries(Object.entries(kit).reverse()) as typeof kit;
    expect(sameContent(kit, reordered)).toBe(true);
    expect(sameContent(kit, setLethalityView(kit, { tab: "armor" }))).toBe(true);
    expect(sameContent(kit, { ...kit, budget: 1 })).toBe(false);
  });
});
