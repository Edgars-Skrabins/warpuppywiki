import { z } from "zod";
import { createStore } from "@/core/state";
import { Loadout } from "../model/loadout";

export const MAX_SAVED_LOADOUTS = 100;
export const MAX_NAME_LENGTH = 60;
export const UNTITLED_NAME = "Untitled loadout";
export const COPY_SUFFIX = " (copy)";

export const SavedLoadout = z.object({
  id: z.string(),
  name: z.string(),
  loadout: Loadout,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SavedLoadout = z.infer<typeof SavedLoadout>;

export type StoredEntries = unknown[];

export const savedLoadoutsStore = createStore<StoredEntries>({
  key: "loadouts",
  version: 1,
  schema: z.array(z.unknown()),
  defaults: [],
});

export type SavedEntry =
  { kind: "saved"; key: string; saved: SavedLoadout } | { kind: "unreadable"; key: string; name: string | null };

export type SaveResult = { ok: true; entries: StoredEntries; saved: SavedLoadout } | { ok: false; reason: "limit" };

export interface SaveContext {
  now: Date;
  newId: () => string;
}

function entryKey(raw: unknown, position: number): string {
  if (typeof raw === "object" && raw !== null && "id" in raw && typeof raw.id === "string") {
    return raw.id;
  }
  return `#${position}`;
}

function entryName(raw: unknown): string | null {
  return typeof raw === "object" && raw !== null && "name" in raw && typeof raw.name === "string" ? raw.name : null;
}

export function readEntries(entries: StoredEntries): SavedEntry[] {
  return entries.map((raw, position): SavedEntry => {
    const key = entryKey(raw, position);
    const parsed = SavedLoadout.safeParse(raw);
    return parsed.success
      ? { kind: "saved", key, saved: parsed.data }
      : { kind: "unreadable", key, name: entryName(raw) };
  });
}

export function findSaved(entries: StoredEntries, id: string): SavedLoadout | null {
  for (const entry of readEntries(entries)) {
    if (entry.kind === "saved" && entry.saved.id === id) {
      return entry.saved;
    }
  }
  return null;
}

export function displayName(name: string): string {
  const trimmed = name.trim();
  return trimmed === "" ? UNTITLED_NAME : trimmed;
}

export function clampName(name: string): string {
  return name.slice(0, MAX_NAME_LENGTH);
}

export function copyName(name: string): string {
  const base = displayName(name);
  return `${base.slice(0, MAX_NAME_LENGTH - COPY_SUFFIX.length)}${COPY_SUFFIX}`;
}

function withName(loadout: Loadout, name: string): Loadout {
  return { ...loadout, name };
}

function append(entries: StoredEntries, loadout: Loadout, name: string, context: SaveContext): SaveResult {
  if (entries.length >= MAX_SAVED_LOADOUTS) {
    return { ok: false, reason: "limit" };
  }
  const time = context.now.toISOString();
  const saved: SavedLoadout = {
    id: context.newId(),
    name,
    loadout: withName(loadout, name),
    createdAt: time,
    updatedAt: time,
  };
  return { ok: true, entries: [...entries, saved], saved };
}

export function saveLoadout(
  entries: StoredEntries,
  id: string | null,
  loadout: Loadout,
  context: SaveContext,
): SaveResult {
  const existing = id === null ? null : findSaved(entries, id);
  const name = clampName(loadout.name);
  if (existing === null) {
    return append(entries, loadout, name, context);
  }
  const saved: SavedLoadout = {
    ...existing,
    name,
    loadout: withName(loadout, name),
    updatedAt: context.now.toISOString(),
  };
  return {
    ok: true,
    entries: entries.map((raw, position) => (entryKey(raw, position) === existing.id ? saved : raw)),
    saved,
  };
}

export function saveAsNew(entries: StoredEntries, loadout: Loadout, context: SaveContext): SaveResult {
  return append(entries, loadout, copyName(loadout.name), context);
}

export function duplicateSaved(entries: StoredEntries, id: string, context: SaveContext): SaveResult | null {
  const existing = findSaved(entries, id);
  return existing === null ? null : saveAsNew(entries, existing.loadout, context);
}

export function renameSaved(entries: StoredEntries, id: string, name: string, now: Date): StoredEntries {
  const existing = findSaved(entries, id);
  if (existing === null) {
    return entries;
  }
  const clamped = clampName(name);
  const renamed: SavedLoadout = {
    ...existing,
    name: clamped,
    loadout: withName(existing.loadout, clamped),
    updatedAt: now.toISOString(),
  };
  return entries.map((raw, position) => (entryKey(raw, position) === id ? renamed : raw));
}

export function removeEntry(entries: StoredEntries, key: string): StoredEntries {
  return entries.filter((raw, position) => entryKey(raw, position) !== key);
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

export function sameContent(a: Loadout, b: Loadout): boolean {
  return stableStringify({ ...a, view: null }) === stableStringify({ ...b, view: null });
}
