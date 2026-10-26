import { useCallback, useSyncExternalStore } from "react";
import type { Store } from "./storage";

export function useStoredState<T>(store: Store<T>): [T, (next: T | ((prev: T) => T)) => void] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === store.storageKey) {
          onChange();
        }
      };
      window.addEventListener("storage", onStorage);
      const unsubscribe = store.subscribe(onChange);
      return () => {
        window.removeEventListener("storage", onStorage);
        unsubscribe();
      };
    },
    [store],
  );
  const value = useSyncExternalStore(subscribe, store.read, store.read);
  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      store.write(typeof next === "function" ? (next as (prev: T) => T)(store.read()) : next);
    },
    [store],
  );
  return [value, setValue];
}
