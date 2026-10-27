import { useMemo } from "react";
import { useGameDataMany, type DamageFile, type DataState, type EquipmentFile } from "@/core/data";
import { useWeaponIndex, type WeaponIndex } from "@/core/weapons";

export interface DamageModel {
  damage: DamageFile;
  equipment: EquipmentFile;
  weapons: WeaponIndex;
}

const DAMAGE_FILES = ["damage", "equipment"] as const;

export function useDamageModel(): DataState<DamageModel> {
  const state = useGameDataMany(DAMAGE_FILES);
  const weaponsState = useWeaponIndex();
  const damage = state.status === "success" ? state.data.damage : undefined;
  const equipment = state.status === "success" ? state.data.equipment : undefined;
  const weapons = weaponsState.status === "success" ? weaponsState.data : undefined;
  const model = useMemo(
    () => (damage && equipment && weapons ? { damage, equipment, weapons } : undefined),
    [damage, equipment, weapons],
  );
  if (state.status !== "success") {
    return state;
  }
  if (weaponsState.status !== "success") {
    return weaponsState;
  }
  return model === undefined ? { status: "loading" } : { status: "success", data: model };
}
