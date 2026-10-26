import { useCallback, useEffect, useSyncExternalStore } from "react";

export type ThemePreference = "dark" | "light" | "system";

export const THEME_STORAGE_KEY = "wpw.theme";

const listeners = new Set<() => void>();

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "dark" || value === "light" || value === "system";
}

export function readThemePreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

let current: ThemePreference | null = null;

function getSnapshot(): ThemePreference {
  if (current === null) {
    current = readThemePreference();
  }
  return current;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function applyTheme(pref: ThemePreference): void {
  const root = document.documentElement;
  if (pref === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", pref);
  }
}

function writeThemePreference(pref: ThemePreference): boolean {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, pref);
    return true;
  } catch {
    return false;
  }
}

export function setThemePreference(pref: ThemePreference): void {
  writeThemePreference(pref);
  current = pref;
  applyTheme(pref);
  listeners.forEach((listener) => listener());
}

export function useTheme(): [ThemePreference, (pref: ThemePreference) => void] {
  const pref = useSyncExternalStore(subscribe, getSnapshot, () => "system" as const);

  useEffect(() => {
    applyTheme(pref);
  }, [pref]);

  const setPref = useCallback((next: ThemePreference) => setThemePreference(next), []);

  return [pref, setPref];
}
