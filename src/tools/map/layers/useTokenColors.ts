import { useMemo, useSyncExternalStore } from "react";

const FALLBACK_COLOR = "#9b9c97";
const SEPARATOR = "|";

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  const media = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: light)") : null;
  media?.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media?.removeEventListener("change", onChange);
  };
}

function readTokens(tokens: readonly string[]): string {
  const style = getComputedStyle(document.documentElement);
  return tokens.map((token) => style.getPropertyValue(token).trim() || FALLBACK_COLOR).join(SEPARATOR);
}

export function useTokenColors(tokens: readonly string[]): string[] {
  const snapshot = useSyncExternalStore(subscribe, () => readTokens(tokens));
  return useMemo(() => snapshot.split(SEPARATOR), [snapshot]);
}
