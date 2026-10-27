import { z } from "zod";
import { defineUrlState } from "@/core/state";
import { MAX_DISTANCES } from "./logic/setup";

const Setup = z.object({
  weapon: z.string().nullable(),
  ammo: z.string().nullable(),
  sight: z.string().nullable(),
  zero: z.number().nullable(),
});

const BallisticsState = z.object({
  primary: Setup,
  comparison: Setup.nullable(),
  maxDistance: z.literal(MAX_DISTANCES).nullable(),
});

export type BallisticsState = z.infer<typeof BallisticsState>;

export const EMPTY_SETUP = { weapon: null, ammo: null, sight: null, zero: null };

export const ballisticsState = defineUrlState<BallisticsState>({
  key: "b",
  version: 1,
  schema: BallisticsState,
  defaults: { primary: EMPTY_SETUP, comparison: null, maxDistance: null },
});
