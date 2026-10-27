import { useMemo } from "react";
import { sameId, useCatalog, type Catalog } from "@/core/catalog";
import { MODEL_NOTES } from "@/core/damage";
import { useGameDataMany, useLatestBuild, type DamageFile, type EquipmentFile } from "@/core/data";
import { useWeaponIndex, type WeaponIndex } from "@/core/weapons";
import { DataStateView, EmptyState, Panel, Stack } from "@/ui";
import { AmmoMatrix } from "./components/AmmoMatrix";
import { ArmorTable } from "./components/ArmorTable";
import { WearChart } from "./components/WearChart";
import { WeightClassTable } from "./components/WeightClassTable";
import { defaultReferenceWeapon, matrixColumns, protectiveArmor, referenceWeapons } from "./logic/ammoMatrix";
import { armorRows } from "./logic/armorRows";
import { weightClassRows } from "./logic/weightClassRows";
import { useArmorState } from "./state";

interface ArmorAndWeightProps {
  catalog: Catalog;
  equipment: EquipmentFile;
  damage: DamageFile;
  index: WeaponIndex;
  build: string;
}

function findById<T extends { id: string }>(items: readonly T[], id: string | null): T | undefined {
  return id === null ? undefined : items.find((item) => sameId(item.id, id));
}

function ArmorAndWeight({ catalog, equipment, damage, index, build }: ArmorAndWeightProps) {
  const [state, update] = useArmorState();
  const rows = useMemo(
    () => ({
      body: armorRows(equipment.armor, catalog, "body"),
      helmet: armorRows(equipment.armor, catalog, "helmet"),
    }),
    [equipment, catalog],
  );
  const columns = useMemo(() => matrixColumns(rows.body), [rows]);
  const wearable = useMemo(() => protectiveArmor(rows.body), [rows]);
  const weapons = useMemo(() => referenceWeapons(index), [index]);
  const classes = useMemo(() => weightClassRows(equipment.weightClasses), [equipment]);
  const notes = useMemo(() => MODEL_NOTES.map((note) => note.replace("<build>", build)), [build]);

  const matrixWeapon = findById(weapons, state.weapon) ?? defaultReferenceWeapon(weapons);
  const wearWeapon = findById(weapons, state.wearWeapon) ?? defaultReferenceWeapon(weapons);
  const wearArmor = findById(wearable, state.wearArmor) ?? wearable.at(-1);

  return (
    <Stack gap={6}>
      <Panel title="Armor and helmets" description="Click a row to see what it covers.">
        <ArmorTable
          rows={rows}
          tab={state.tab}
          onTabChange={(tab) => update({ tab })}
          selectedId={state.selected}
          onSelect={(selected) => update({ selected })}
        />
      </Panel>
      <Panel title="Ammo against armor" description="Shots to kill and the armor's effective damage reduction.">
        {matrixWeapon ? (
          <AmmoMatrix
            damage={damage}
            index={index}
            weapons={weapons}
            weapon={matrixWeapon}
            onWeaponChange={(weapon) => update({ weapon })}
            columns={columns}
            notes={notes}
          />
        ) : (
          <EmptyState title="No weapons" text="This build has no player bullet weapons." />
        )}
      </Panel>
      <Panel title="Armor wear" description="Consecutive hits to the upper chest until the armor is spent.">
        {wearWeapon && wearArmor ? (
          <WearChart
            damage={damage}
            index={index}
            armorRows={wearable}
            armor={wearArmor}
            onArmorChange={(id) => update({ wearArmor: id })}
            weapons={weapons}
            weapon={wearWeapon}
            onWeaponChange={(id) => update({ wearWeapon: id, wearAmmo: null })}
            ammoId={state.wearAmmo}
            onAmmoChange={(id) => update({ wearAmmo: id })}
            notes={notes}
          />
        ) : (
          <EmptyState title="Nothing to simulate" text="This build has no body armor or bullet weapons." />
        )}
      </Panel>
      <Panel title="Weight classes" description="What each class costs in mobility and aim.">
        <WeightClassTable rows={classes} kitKg={state.kitKg} onKitKgChange={(kitKg) => update({ kitKg })} />
      </Panel>
    </Stack>
  );
}

export default function Tool() {
  const catalog = useCatalog();
  const files = useGameDataMany(["equipment", "damage"]);
  const index = useWeaponIndex();
  const build = useLatestBuild();
  return (
    <DataStateView state={catalog}>
      {(loadedCatalog) => (
        <DataStateView state={files}>
          {({ equipment, damage }) => (
            <DataStateView state={index}>
              {(loadedIndex) => (
                <DataStateView state={build}>
                  {(loadedBuild) => (
                    <ArmorAndWeight
                      catalog={loadedCatalog}
                      equipment={equipment}
                      damage={damage}
                      index={loadedIndex}
                      build={loadedBuild}
                    />
                  )}
                </DataStateView>
              )}
            </DataStateView>
          )}
        </DataStateView>
      )}
    </DataStateView>
  );
}
