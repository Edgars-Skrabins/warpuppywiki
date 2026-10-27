import { PLAN_LIMITS } from "./plan";

export const RING_PRESETS = [
  { id: "infantry", label: "Infantry", distances: [100, 200, 300, 500] },
  { id: "marksman", label: "Marksman", distances: [300, 500, 800, 1000] },
  { id: "artillery", label: "Mortar / artillery", distances: [500, 1000, 2000, 3000] },
] as const;

export type RingPresetId = (typeof RING_PRESETS)[number]["id"] | "custom";

export type CustomDistances = { ok: true; distances: number[] } | { ok: false; error: string };

export function presetDistances(id: RingPresetId): readonly number[] | null {
  return RING_PRESETS.find((preset) => preset.id === id)?.distances ?? null;
}

export function parseCustomDistances(text: string): CustomDistances {
  const parts = text
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
  if (parts.length === 0) {
    return { ok: false, error: "Enter at least one distance in meters." };
  }
  if (parts.length > PLAN_LIMITS.ringDistances) {
    return { ok: false, error: `Up to ${PLAN_LIMITS.ringDistances} distances.` };
  }
  const values = parts.map((part) => Number(part.replace(/\s*m$/i, "")));
  if (values.some((value) => !Number.isFinite(value))) {
    return { ok: false, error: "Use numbers separated by commas, for example 150, 400." };
  }
  if (values.some((value) => value < PLAN_LIMITS.minRingDistance || value > PLAN_LIMITS.maxRingDistance)) {
    return {
      ok: false,
      error: `Distances must be between ${PLAN_LIMITS.minRingDistance} and ${PLAN_LIMITS.maxRingDistance.toLocaleString("en-US")} m.`,
    };
  }
  return { ok: true, distances: [...new Set(values.map((value) => Math.round(value)))].sort((a, b) => a - b) };
}
