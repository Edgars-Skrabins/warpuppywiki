import { z } from "zod";
import { defineUrlState, encodeState } from "@/core/state";
import { STK_DISTANCE } from "./weaponRows";

const TtkMatchup = z.object({
  weaponId: z.string(),
  ammoType: z.string(),
  magazineId: z.string().nullable(),
  distance: z.number().min(0).max(1000),
  placement: z.enum(["head", "upper-chest", "center-mass", "stomach", "legs", "arms", "mixed", "custom"]),
  custom: z.array(z.string()).max(20),
  health: z.number().min(1).max(1000),
  bodyArmorId: z.string().nullable(),
  helmetId: z.string().nullable(),
  condition: z.number().min(0).max(1),
  pellets: z.number().int().min(1).max(20),
});

export type TtkMatchup = z.infer<typeof TtkMatchup>;

export const ttkMatchupCodec = defineUrlState<TtkMatchup>({
  key: "m",
  version: 1,
  schema: TtkMatchup,
  defaults: {
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
  },
});

export function ttkMatchup(weaponId: string): TtkMatchup {
  return {
    weaponId,
    ammoType: "FMJ",
    magazineId: null,
    distance: STK_DISTANCE,
    placement: "upper-chest",
    custom: [],
    health: 100,
    bodyArmorId: null,
    helmetId: null,
    condition: 1,
    pellets: 6,
  };
}

export function ttkLink(weaponId: string): string {
  const params = new URLSearchParams({ [ttkMatchupCodec.key]: encodeState(ttkMatchupCodec, ttkMatchup(weaponId)) });
  return `/ttk?${params.toString()}`;
}

export function recoilLink(weaponId: string): string {
  return `/recoil?${new URLSearchParams({ w: weaponId }).toString()}`;
}
