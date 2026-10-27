import { z } from "zod";
import { defineUrlState } from "@/core/state";

export const PLACEMENTS = ["head", "upper-chest", "center-mass", "stomach", "legs", "arms", "mixed", "custom"] as const;

export type Placement = (typeof PLACEMENTS)[number];

export const MAX_DISTANCE = 1000;
export const MAX_CUSTOM_ZONES = 20;

export const MatchupState = z.object({
  weaponId: z.string(),
  ammoType: z.string(),
  magazineId: z.string().nullable(),
  distance: z.number().min(0).max(MAX_DISTANCE),
  placement: z.enum(PLACEMENTS),
  custom: z.array(z.string()).max(MAX_CUSTOM_ZONES),
  health: z.number().min(1).max(1000),
  bodyArmorId: z.string().nullable(),
  helmetId: z.string().nullable(),
  condition: z.number().min(0).max(1),
  pellets: z.number().int().min(1).max(20),
});

export type MatchupState = z.infer<typeof MatchupState>;

export const DEFAULT_MATCHUP: MatchupState = {
  weaponId: "",
  ammoType: "FMJ",
  magazineId: null,
  distance: 50,
  placement: "upper-chest",
  custom: [],
  health: 100,
  bodyArmorId: null,
  helmetId: null,
  condition: 1,
  pellets: 6,
};

export const matchupCodec = defineUrlState<MatchupState>({
  key: "m",
  version: 1,
  schema: MatchupState,
  defaults: DEFAULT_MATCHUP,
});
