import { useEffect, useState } from "react";

export const MAP_MODES = ["pan", "measure", "rings", "pin", "los"] as const;

export type MapMode = (typeof MAP_MODES)[number];

export const MODE_LABELS: Record<MapMode, string> = {
  pan: "Pan",
  measure: "Measure",
  rings: "Range rings",
  pin: "Pin",
  los: "Line of sight",
};

export const MODE_HINTS: Record<MapMode, string | null> = {
  pan: null,
  measure: "Click to add points. Double-click or Enter to finish.",
  rings: "Click to place a ring set.",
  pin: "Click to place a pin.",
  los: null,
};

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function useMapMode(): [MapMode, (mode: MapMode) => void] {
  const [mode, setMode] = useState<MapMode>("pan");

  useEffect(() => {
    if (mode === "pan") {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMode("pan");
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mode]);

  return [mode, setMode];
}
