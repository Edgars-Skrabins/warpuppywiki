import { z } from "zod";
import { defineUrlState, useUrlState } from "@/core/state";

const ArmorState = z.object({
  tab: z.enum(["body", "helmet"]),
  selected: z.string().nullable(),
  weapon: z.string().nullable(),
  wearArmor: z.string().nullable(),
  wearWeapon: z.string().nullable(),
  wearAmmo: z.string().nullable(),
  kitKg: z.number().nullable(),
});

export type ArmorState = z.infer<typeof ArmorState>;

export const armorStateCodec = defineUrlState<ArmorState>({
  key: "s",
  version: 1,
  schema: ArmorState,
  defaults: {
    tab: "body",
    selected: null,
    weapon: null,
    wearArmor: null,
    wearWeapon: null,
    wearAmmo: null,
    kitKg: null,
  },
});

export function useArmorState() {
  const [state, setState] = useUrlState(armorStateCodec);
  const update = (patch: Partial<ArmorState>) => setState((prev) => ({ ...prev, ...patch }));
  return [state, update] as const;
}
