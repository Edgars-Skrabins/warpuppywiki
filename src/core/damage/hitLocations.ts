import type { HitLocation } from "./types";

export type HitLocationGroup = "Head" | "Neck" | "Torso" | "Arms" | "Legs";

export interface HitLocationInfo {
  location: HitLocation;
  label: string;
  group: HitLocationGroup;
}

export const HIT_LOCATIONS: readonly HitLocationInfo[] = [
  { location: "Head", label: "Head", group: "Head" },
  { location: "Neck", label: "Neck", group: "Neck" },
  { location: "Torso.Upper", label: "Upper chest", group: "Torso" },
  { location: "Torso.Middle", label: "Center mass", group: "Torso" },
  { location: "Torso.Lower", label: "Stomach", group: "Torso" },
  { location: "Pelvis", label: "Pelvis", group: "Torso" },
  { location: "Arm.Upper", label: "Upper arm", group: "Arms" },
  { location: "Arm.Lower", label: "Forearm", group: "Arms" },
  { location: "Arm.Hand", label: "Hand", group: "Arms" },
  { location: "Leg.Thigh", label: "Thigh", group: "Legs" },
  { location: "Leg.Calf", label: "Calf", group: "Legs" },
  { location: "Leg.Foot", label: "Foot", group: "Legs" },
];

export type HitPatternId = "head" | "upper-chest" | "center-mass" | "stomach" | "legs" | "arms" | "mixed";

export interface HitPattern {
  id: HitPatternId;
  label: string;
  locations: readonly HitLocation[];
}

export const HIT_PATTERNS: readonly HitPattern[] = [
  { id: "head", label: "Head", locations: ["Head"] },
  { id: "upper-chest", label: "Upper chest", locations: ["Torso.Upper"] },
  { id: "center-mass", label: "Center mass", locations: ["Torso.Middle"] },
  { id: "stomach", label: "Stomach", locations: ["Torso.Lower"] },
  { id: "legs", label: "Legs", locations: ["Leg.Thigh"] },
  { id: "arms", label: "Arms", locations: ["Arm.Upper"] },
  { id: "mixed", label: "Mixed", locations: ["Torso.Upper", "Torso.Upper", "Torso.Middle", "Head"] },
];

export function hitLocationLabel(location: HitLocation): string {
  return HIT_LOCATIONS.find((info) => info.location === location)?.label ?? location;
}

export function hitPattern(id: HitPatternId): HitPattern {
  const pattern = HIT_PATTERNS.find((entry) => entry.id === id);
  if (pattern === undefined) {
    throw new Error(`Unknown hit pattern ${id}`);
  }
  return pattern;
}
