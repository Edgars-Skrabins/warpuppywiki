import { useMemo } from "react";
import { useCatalog } from "@/core/catalog";
import { useGameDataMany, type DataState } from "@/core/data";
import { buildWeaponIndex, type WeaponIndex } from "./weaponIndex";

const WEAPON_FILES = ["weapons", "ammo", "attachments"] as const;

export function useWeaponIndex(): DataState<WeaponIndex> {
  const state = useGameDataMany(WEAPON_FILES);
  const catalogState = useCatalog();
  const files = state.status === "success" ? state.data : undefined;
  const weapons = files?.weapons;
  const ammo = files?.ammo;
  const attachments = files?.attachments;
  const catalog = catalogState.status === "success" ? catalogState.data : undefined;
  const index = useMemo(
    () =>
      weapons && ammo && attachments && catalog ? buildWeaponIndex({ weapons, ammo, attachments, catalog }) : undefined,
    [weapons, ammo, attachments, catalog],
  );
  if (state.status !== "success") {
    return state;
  }
  if (catalogState.status !== "success") {
    return catalogState;
  }
  return index === undefined ? { status: "loading" } : { status: "success", data: index };
}
