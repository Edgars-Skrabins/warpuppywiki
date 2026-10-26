import { defineUrlState, type UrlStateCodec } from "@/core/state";
import { emptyLoadout, Loadout } from "./model/loadout";

export const LOADOUT_URL_KEY = "l";

export function loadoutCodec(defaultBudget: number): UrlStateCodec<Loadout> {
  return defineUrlState({
    key: LOADOUT_URL_KEY,
    version: 1,
    schema: Loadout,
    defaults: emptyLoadout(defaultBudget),
  });
}
