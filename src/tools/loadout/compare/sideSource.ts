import { decodeState, type UrlStateCodec } from "@/core/state";
import { emptyLoadout, type Loadout } from "../model/loadout";
import { displayName, findSaved, type StoredEntries } from "../saves/savedLoadouts";

export const CURRENT_SIDE = "current";
export const EMPTY_SIDE = "empty";
const SAVED_PREFIX = "saved:";

export type SideSource =
  { kind: "current" } | { kind: "empty" } | { kind: "saved"; id: string } | { kind: "link"; encoded: string };

export type ResolvedSide =
  { ok: true; loadout: Loadout; label: string } | { ok: false; reason: "missing-save" | "invalid-link"; label: string };

export interface SideContext {
  current: Loadout;
  saved: StoredEntries;
  codec: UrlStateCodec<Loadout>;
  defaultBudget: number;
}

export function parseSideParam(raw: string | null, fallback: SideSource): SideSource {
  if (raw === null || raw === "") {
    return fallback;
  }
  if (raw === CURRENT_SIDE) {
    return { kind: "current" };
  }
  if (raw === EMPTY_SIDE) {
    return { kind: "empty" };
  }
  if (raw.startsWith(SAVED_PREFIX)) {
    return { kind: "saved", id: raw.slice(SAVED_PREFIX.length) };
  }
  return { kind: "link", encoded: raw };
}

export function sideParam(source: SideSource): string {
  switch (source.kind) {
    case "current":
      return CURRENT_SIDE;
    case "empty":
      return EMPTY_SIDE;
    case "saved":
      return `${SAVED_PREFIX}${source.id}`;
    case "link":
      return source.encoded;
  }
}

function encodedFromText(text: string, key: string): string | null {
  const trimmed = text.trim();
  if (trimmed === "") {
    return null;
  }
  const hash = trimmed.includes("#") ? trimmed.slice(trimmed.indexOf("#") + 1) : trimmed;
  const query = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : hash;
  const value = new URLSearchParams(query).get(key);
  return value === null || value === "" ? null : value;
}

export function parsePastedLink(text: string, codec: UrlStateCodec<Loadout>): SideSource | null {
  const encoded = encodedFromText(text, codec.key);
  if (encoded === null || decodeState(codec, encoded).error) {
    return null;
  }
  return { kind: "link", encoded };
}

export function resolveSide(source: SideSource, context: SideContext): ResolvedSide {
  switch (source.kind) {
    case "current":
      return { ok: true, loadout: context.current, label: "Current loadout" };
    case "empty":
      return { ok: true, loadout: emptyLoadout(context.defaultBudget), label: "Empty loadout" };
    case "saved": {
      const saved = findSaved(context.saved, source.id);
      return saved === null
        ? { ok: false, reason: "missing-save", label: "Saved loadout not found" }
        : { ok: true, loadout: saved.loadout, label: displayName(saved.name) };
    }
    case "link": {
      const decoded = decodeState(context.codec, source.encoded);
      return decoded.error
        ? { ok: false, reason: "invalid-link", label: "That link isn't a loadout link" }
        : { ok: true, loadout: decoded.state, label: `${displayName(decoded.state.name)} (link)` };
    }
  }
}
