import { useCallback, useMemo } from "react";
import { useStoredState } from "@/core/state";
import type { Loadout } from "../model/loadout";
import {
  duplicateSaved,
  findSaved,
  readEntries,
  removeEntry,
  renameSaved,
  saveAsNew,
  saveLoadout,
  savedLoadoutsStore,
  type SaveContext,
  type SavedEntry,
  type SavedLoadout,
  type SaveResult,
} from "./savedLoadouts";

export interface SavedLoadouts {
  entries: SavedEntry[];
  find: (id: string | null) => SavedLoadout | null;
  save: (id: string | null, loadout: Loadout) => SaveResult;
  saveAsNew: (loadout: Loadout) => SaveResult;
  duplicate: (id: string) => SaveResult | null;
  rename: (id: string, name: string) => void;
  remove: (key: string) => void;
}

function saveContext(): SaveContext {
  return { now: new Date(), newId: () => crypto.randomUUID() };
}

function commit<T extends SaveResult | null>(result: T): T {
  if (result?.ok) {
    savedLoadoutsStore.write(result.entries);
  }
  return result;
}

export function useSavedLoadouts(): SavedLoadouts {
  const [stored] = useStoredState(savedLoadoutsStore);
  const entries = useMemo(() => readEntries(stored), [stored]);
  const find = useCallback((id: string | null) => (id === null ? null : findSaved(stored, id)), [stored]);
  return {
    entries,
    find,
    save: (id, loadout) => commit(saveLoadout(savedLoadoutsStore.read(), id, loadout, saveContext())),
    saveAsNew: (loadout) => commit(saveAsNew(savedLoadoutsStore.read(), loadout, saveContext())),
    duplicate: (id) => commit(duplicateSaved(savedLoadoutsStore.read(), id, saveContext())),
    rename: (id, name) => savedLoadoutsStore.write(renameSaved(savedLoadoutsStore.read(), id, name, new Date())),
    remove: (key) => savedLoadoutsStore.write(removeEntry(savedLoadoutsStore.read(), key)),
  };
}
