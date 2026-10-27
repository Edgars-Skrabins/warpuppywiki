import { useCallback, useMemo, useState } from "react";
import { useCatalog, type Catalog } from "@/core/catalog";
import { useGameDataMany, type DataState, type EquipmentFile, type MetaFile } from "@/core/data";
import { useUrlState } from "@/core/state";
import { useWeaponIndex, type WeaponIndex } from "@/core/weapons";
import { Button, DataStateView, Dialog, LoadingState, Panel } from "@/ui";
import { GearList } from "./components/GearList";
import { SlotGrid } from "./components/SlotGrid";
import { SummaryPanel } from "./components/SummaryPanel";
import {
  emptyLoadout,
  setGearQuantity,
  setSlotItem,
  setWeaponSetup,
  startingBudget,
  type Loadout,
  type SlotId,
} from "./model/loadout";
import { SLOT_DEFINITIONS, slotDefinition } from "./model/slots";
import { kitStatSources } from "./model/totals";
import { defaultSetup, validateLoadout } from "./model/weaponSetup";
import { loadoutCodec } from "./state";
import styles from "./Tool.module.css";

const LOADOUT_FILES = ["equipment", "meta"] as const;

interface LoadoutData {
  catalog: Catalog;
  equipment: EquipmentFile;
  meta: MetaFile;
  index: WeaponIndex;
}

function useLoadoutData(): DataState<LoadoutData> {
  const catalog = useCatalog();
  const files = useGameDataMany(LOADOUT_FILES);
  const index = useWeaponIndex();
  if (catalog.status !== "success") {
    return catalog;
  }
  if (files.status !== "success") {
    return files;
  }
  if (index.status !== "success") {
    return index;
  }
  return { status: "success", data: { catalog: catalog.data, ...files.data, index: index.data } };
}

function isEmpty(loadout: Loadout): boolean {
  return loadout.gear.length === 0 && SLOT_DEFINITIONS.every((slot) => loadout.slots[slot.id] === null);
}

function LoadoutSkeleton() {
  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <div className={styles.skeletonGrid}>
          {SLOT_DEFINITIONS.map((slot) => (
            <LoadingState key={slot.id} variant="block" height={232} label={`Loading ${slot.label}`} />
          ))}
        </div>
      </div>
      <LoadingState variant="block" height={480} label="Loading summary" />
    </div>
  );
}

function LoadoutBuilder({ catalog, equipment, meta, index }: LoadoutData) {
  const codec = useMemo(() => loadoutCodec(startingBudget(meta)), [meta]);
  const [decoded, setDecoded] = useUrlState(codec);
  const validation = useMemo(() => validateLoadout(decoded, index), [decoded, index]);
  const loadout = validation.loadout;
  const setLoadout = useCallback(
    (update: (prev: Loadout) => Loadout) => setDecoded((prev) => update(validateLoadout(prev, index).loadout)),
    [setDecoded, index],
  );
  const kitSources = useMemo(() => kitStatSources(loadout, catalog, equipment), [loadout, catalog, equipment]);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const changeSlot = (slot: SlotId, itemId: string | null) =>
    setLoadout((prev) =>
      itemId !== null && slotDefinition(slot).kind === "weapon"
        ? setWeaponSetup(prev, slot, defaultSetup(itemId, index, catalog))
        : setSlotItem(prev, slot, itemId),
    );

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <Panel
          title="Slots"
          actions={
            <Button size="sm" variant="ghost" onPress={() => setConfirmingClear(true)} isDisabled={isEmpty(loadout)}>
              Clear loadout
            </Button>
          }
        >
          <SlotGrid
            loadout={loadout}
            catalog={catalog}
            index={index}
            kitSources={kitSources}
            notices={validation.droppedSlots}
            onSlotChange={changeSlot}
            onSetupChange={(slot, setup) => setLoadout((prev) => setWeaponSetup(prev, slot, setup))}
          />
        </Panel>
        <GearList
          loadout={loadout}
          catalog={catalog}
          onQuantityChange={(itemId, quantity) => setLoadout((prev) => setGearQuantity(prev, itemId, quantity))}
        />
      </div>
      <div className={styles.aside}>
        <SummaryPanel
          loadout={loadout}
          catalog={catalog}
          equipment={equipment}
          onBudgetChange={(budget) => setLoadout((prev) => ({ ...prev, budget }))}
        />
      </div>
      <Dialog
        title="Clear loadout?"
        role="alertdialog"
        size="sm"
        isOpen={confirmingClear}
        onOpenChange={setConfirmingClear}
        actions={(close) => (
          <>
            <Button variant="ghost" onPress={close}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onPress={() => {
                setLoadout((prev) => ({ ...emptyLoadout(prev.budget), name: prev.name }));
                close();
              }}
            >
              Clear
            </Button>
          </>
        )}
      >
        <p>This removes every item from the slots and the gear list. The budget stays.</p>
      </Dialog>
    </div>
  );
}

export default function Tool() {
  const state = useLoadoutData();
  return (
    <DataStateView state={state} loading={<LoadoutSkeleton />}>
      {(data) => <LoadoutBuilder {...data} />}
    </DataStateView>
  );
}
