import { z } from "zod";
import { defineUrlState } from "@/core/state";

export const PLACEMENTS = ["head", "upper-chest", "center-mass", "stomach", "legs", "arms", "mixed", "custom"] as const;

export type Placement = (typeof PLACEMENTS)[number];

export const MAX_DISTANCE = 1000;
export const MAX_CUSTOM_ZONES = 20;

export const MAX_SETUPS = 4;

export const Setup = z.object({
  weaponId: z.string(),
  ammoType: z.string(),
  magazineId: z.string().nullable(),
});

export type Setup = z.infer<typeof Setup>;

export const SharedTargetState = z.object({
  distance: z.number().min(0).max(MAX_DISTANCE),
  placement: z.enum(PLACEMENTS),
  custom: z.array(z.string()).max(MAX_CUSTOM_ZONES),
  health: z.number().min(1).max(1000),
  bodyArmorId: z.string().nullable(),
  helmetId: z.string().nullable(),
  condition: z.number().min(0).max(1),
  pellets: z.number().int().min(1).max(20),
});

export type SharedTargetState = z.infer<typeof SharedTargetState>;

export const MatchupState = Setup.extend(SharedTargetState.shape);

export type MatchupState = z.infer<typeof MatchupState>;

export const CompareState = z.object({
  shared: SharedTargetState,
  setups: z.array(Setup).min(1).max(MAX_SETUPS),
});

export type CompareState = z.infer<typeof CompareState>;

export const DEFAULT_SETUP: Setup = {
  weaponId: "",
  ammoType: "FMJ",
  magazineId: null,
};

export const DEFAULT_SHARED: SharedTargetState = {
  distance: 50,
  placement: "upper-chest",
  custom: [],
  health: 100,
  bodyArmorId: null,
  helmetId: null,
  condition: 1,
  pellets: 6,
};

export const DEFAULT_MATCHUP: MatchupState = { ...DEFAULT_SETUP, ...DEFAULT_SHARED };

export const DEFAULT_COMPARE: CompareState = { shared: DEFAULT_SHARED, setups: [DEFAULT_SETUP] };

export function setupOf(matchup: MatchupState): Setup {
  return { weaponId: matchup.weaponId, ammoType: matchup.ammoType, magazineId: matchup.magazineId };
}

export function sharedOf(matchup: MatchupState): SharedTargetState {
  return {
    distance: matchup.distance,
    placement: matchup.placement,
    custom: matchup.custom,
    health: matchup.health,
    bodyArmorId: matchup.bodyArmorId,
    helmetId: matchup.helmetId,
    condition: matchup.condition,
    pellets: matchup.pellets,
  };
}

export const matchupCodec = defineUrlState<MatchupState>({
  key: "m",
  version: 1,
  schema: MatchupState,
  defaults: DEFAULT_MATCHUP,
});

export const compareCodec = defineUrlState<CompareState>({
  key: "c",
  version: 1,
  schema: CompareState,
  defaults: DEFAULT_COMPARE,
});
