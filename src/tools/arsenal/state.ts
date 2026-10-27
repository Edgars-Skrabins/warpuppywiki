import { z } from "zod";
import { sameId } from "@/core/catalog";
import { defineUrlState } from "@/core/state";

export interface FilterOption {
  id: string;
  label: string;
}

export const ARCHETYPE_FILTERS: readonly FilterOption[] = [
  { id: "AR", label: "AR" },
  { id: "SMG", label: "SMG" },
  { id: "LMG", label: "LMG" },
  { id: "DMR", label: "DMR" },
  { id: "Sniper", label: "Sniper" },
  { id: "Shotgun", label: "Shotgun" },
  { id: "Pistol", label: "Pistol" },
  { id: "Launcher", label: "Launcher" },
  { id: "Bow", label: "Bow" },
];

export const SLOT_FILTERS: readonly FilterOption[] = [
  { id: "Primary", label: "Primary" },
  { id: "Sidearm", label: "Sidearm" },
  { id: "Specialist", label: "Specialist" },
];

const ArsenalFilters = z.object({
  archetypes: z.array(z.string()).max(ARCHETYPE_FILTERS.length),
  slots: z.array(z.string()).max(SLOT_FILTERS.length),
  query: z.string().max(100),
});

export type ArsenalFilters = z.infer<typeof ArsenalFilters>;

export const DEFAULT_FILTERS: ArsenalFilters = { archetypes: [], slots: [], query: "" };

export const filtersCodec = defineUrlState<ArsenalFilters>({
  key: "f",
  version: 1,
  schema: ArsenalFilters,
  defaults: DEFAULT_FILTERS,
});

export const WEAPON_PARAM = "w";

export function toggleValue(values: readonly string[], value: string): string[] {
  return values.some((entry) => sameId(entry, value))
    ? values.filter((entry) => !sameId(entry, value))
    : [...values, value];
}

export function hasActiveFilters(filters: ArsenalFilters): boolean {
  return filters.archetypes.length > 0 || filters.slots.length > 0 || filters.query.trim() !== "";
}
