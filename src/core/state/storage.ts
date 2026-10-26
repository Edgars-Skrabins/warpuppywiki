import type { z } from "zod";

export const STORAGE_PREFIX = "wpw.";

export interface StoreOptions<T> {
  key: string;
  version: number;
  schema: z.ZodType<T>;
  defaults: T;
}

export interface Store<T> {
  storageKey: string;
  read: () => T;
  write: (value: T) => void;
  clear: () => void;
  subscribe: (listener: () => void) => () => void;
}

export function createStore<T>({ key, version, schema, defaults }: StoreOptions<T>): Store<T> {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  const listeners = new Set<() => void>();
  let warned = false;
  let cachedRaw: string | null = null;
  let cachedValue: T = defaults;

  function warn(message: string, error?: unknown) {
    if (!warned) {
      warned = true;
      console.warn(`Storage "${storageKey}": ${message}`, error);
    }
  }

  function getRaw(): string | null {
    try {
      return globalThis.localStorage.getItem(storageKey);
    } catch (error) {
      warn("could not read", error);
      return null;
    }
  }

  function parse(raw: string | null): T {
    if (raw === null) {
      return defaults;
    }
    let stored: unknown;
    try {
      stored = JSON.parse(raw);
    } catch (error) {
      warn("stored value is not valid JSON", error);
      return defaults;
    }
    if (typeof stored !== "object" || stored === null || !("version" in stored) || stored.version !== version) {
      return defaults;
    }
    const parsed = schema.safeParse("value" in stored ? stored.value : undefined);
    if (!parsed.success) {
      warn("stored value does not match the schema", parsed.error);
      return defaults;
    }
    return parsed.data;
  }

  function notify() {
    for (const listener of listeners) {
      listener();
    }
  }

  return {
    storageKey,
    read: () => {
      const raw = getRaw();
      if (raw !== cachedRaw) {
        cachedRaw = raw;
        cachedValue = parse(raw);
      }
      return cachedValue;
    },
    write: (value) => {
      try {
        globalThis.localStorage.setItem(storageKey, JSON.stringify({ version, value }));
      } catch (error) {
        warn("could not write", error);
      }
      notify();
    },
    clear: () => {
      try {
        globalThis.localStorage.removeItem(storageKey);
      } catch (error) {
        warn("could not clear", error);
      }
      notify();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
