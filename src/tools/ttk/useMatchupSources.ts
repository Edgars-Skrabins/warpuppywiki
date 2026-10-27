import { useMemo } from "react";
import { useCatalog } from "@/core/catalog";
import { useGameDataMany, type DataState } from "@/core/data";
import { useWeaponIndex } from "@/core/weapons";
import type { MatchupSources } from "./logic/buildScenario";

const DAMAGE_FILES = ["damage", "equipment"] as const;

export function useMatchupSources(): DataState<MatchupSources> {
  const files = useGameDataMany(DAMAGE_FILES);
  const indexState = useWeaponIndex();
  const catalogState = useCatalog();
  const damage = files.status === "success" ? files.data.damage : undefined;
  const equipment = files.status === "success" ? files.data.equipment : undefined;
  const index = indexState.status === "success" ? indexState.data : undefined;
  const catalog = catalogState.status === "success" ? catalogState.data : undefined;
  const sources = useMemo(
    () => (damage && equipment && index && catalog ? { damage, equipment, index, catalog } : undefined),
    [damage, equipment, index, catalog],
  );
  for (const state of [files, indexState, catalogState]) {
    if (state.status === "error") return state;
  }
  return sources === undefined ? { status: "loading" } : { status: "success", data: sources };
}
