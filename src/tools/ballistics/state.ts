import { z } from "zod";
import { defineUrlState } from "@/core/state";
import { MAX_DISTANCES } from "./logic/setup";

export const MAX_TARGET_SPEED = 200;

const Setup = z.object({
  weapon: z.string().nullable(),
  ammo: z.string().nullable(),
});

const BallisticsState = z.object({
  primary: Setup,
  comparison: Setup.nullable(),
  maxDistance: z.literal(MAX_DISTANCES).nullable(),
  targetSpeed: z.number().positive().max(MAX_TARGET_SPEED).nullable(),
});

export type BallisticsState = z.infer<typeof BallisticsState>;

export const EMPTY_SETUP = { weapon: null, ammo: null };

interface SetupV1 {
  weapon?: unknown;
  ammo?: unknown;
}

function setupFromV1(setup: SetupV1) {
  return { weapon: setup.weapon, ammo: setup.ammo };
}

export const ballisticsState = defineUrlState<BallisticsState>({
  key: "b",
  version: 2,
  schema: BallisticsState,
  defaults: { primary: EMPTY_SETUP, comparison: null, maxDistance: null, targetSpeed: null },
  migrate: {
    1: (old) => {
      const state = old as { primary: SetupV1; comparison: SetupV1 | null; maxDistance: unknown };
      return {
        primary: setupFromV1(state.primary),
        comparison: state.comparison ? setupFromV1(state.comparison) : null,
        maxDistance: state.maxDistance,
        targetSpeed: null,
      };
    },
  },
});
