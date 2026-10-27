import { z } from "zod";
import { defineUrlState } from "@/core/state";

export const WEAPON_PARAM = "w";

const WeaponSetup = z.object({
  weapon: z.string().nullable(),
  slots: z.record(z.string(), z.string().nullable()),
});

export type WeaponSetup = z.infer<typeof WeaponSetup>;

export const RecoilView = z.enum(["aim", "guide"]);

export type RecoilView = z.infer<typeof RecoilView>;

const RecoilState = z.object({
  primary: WeaponSetup,
  compare: WeaponSetup.nullable(),
  view: RecoilView,
});

export type RecoilState = z.infer<typeof RecoilState>;

export const EMPTY_SETUP: WeaponSetup = { weapon: null, slots: {} };

export const recoilState = defineUrlState<RecoilState>({
  key: "s",
  version: 1,
  schema: RecoilState,
  defaults: { primary: EMPTY_SETUP, compare: null, view: "aim" },
});
