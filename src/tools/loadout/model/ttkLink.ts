import { z } from "zod";
import { DEFAULT_HEALTH, DEFAULT_PELLETS_PER_SHOT } from "@/core/damage";
import { defineUrlState, encodeState } from "@/core/state";

export const TTK_ROUTE = "ttk";

export const TtkMatchup = z.object({
  weaponId: z.string(),
  ammoType: z.string(),
  magazineId: z.string().nullable(),
  distance: z.number(),
  placement: z.string(),
  custom: z.array(z.string()),
  health: z.number(),
  bodyArmorId: z.string().nullable(),
  helmetId: z.string().nullable(),
  condition: z.number(),
  pellets: z.number(),
});

export type TtkMatchup = z.infer<typeof TtkMatchup>;

export const TTK_LINK_DISTANCE = 100;

export const ttkMatchupCodec = defineUrlState<TtkMatchup>({
  key: "m",
  version: 1,
  schema: TtkMatchup,
  defaults: {
    weaponId: "",
    ammoType: "FMJ",
    magazineId: null,
    distance: TTK_LINK_DISTANCE,
    placement: "upper-chest",
    custom: [],
    health: DEFAULT_HEALTH,
    bodyArmorId: null,
    helmetId: null,
    condition: 1,
    pellets: DEFAULT_PELLETS_PER_SHOT,
  },
});

export interface TtkLinkInput {
  weaponId: string;
  ammoType: string;
  magazineId: string | null;
  placement: string;
  bodyArmorId: string | null;
  helmetId: string | null;
  distance?: number;
}

export function ttkMatchup(input: TtkLinkInput): TtkMatchup {
  return {
    weaponId: input.weaponId,
    ammoType: input.ammoType,
    magazineId: input.magazineId,
    distance: input.distance ?? TTK_LINK_DISTANCE,
    placement: input.placement,
    custom: [],
    health: DEFAULT_HEALTH,
    bodyArmorId: input.bodyArmorId,
    helmetId: input.helmetId,
    condition: 1,
    pellets: DEFAULT_PELLETS_PER_SHOT,
  };
}

export function buildTtkLink(input: TtkLinkInput): string {
  return `${import.meta.env.BASE_URL}#/${TTK_ROUTE}?${ttkMatchupCodec.key}=${encodeState(ttkMatchupCodec, ttkMatchup(input))}`;
}
