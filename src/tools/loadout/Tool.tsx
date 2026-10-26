import { useMemo, useState } from "react";
import { useCatalog, type Catalog } from "@/core/catalog";
import { useGameDataMany, type DataState, type EquipmentFile, type MetaFile } from "@/core/data";
import { useUrlState } from "@/core/state";
import { Button, DataStateView, Dialog, LoadingState, Panel } from "@/ui";
import { GearList } from "./components/GearList";
import { SlotGrid } from "./components/SlotGrid";
import { SummaryPanel } from "./components/SummaryPanel";
import { emptyLoadout, setGearQuantity, setSlotItem, startingBudget, type Loadout } from "./model/loadout";
import { SLOT_DEFINITIONS } from "./model/slots";
import { loadoutCodec } from "./state";
import styles from "./Tool.module.css";

const LOADOUT_FILES = ["equipment", "meta"] as const;

interface LoadoutData {
  catalog: Catalog;
  equipment: EquipmentFile;
  meta: MetaFile;
}

function useLoadoutData(): DataState<LoadoutData> {
  const catalog = useCatalog();
  const files = useGameDataMany(LOADOUT_FILES);
  if (catalog.status !== "success") {
    return catalog;
  }
  if (files.status !== "success") {
    return files;
  }
  return { status: "success", data: { catalog: catalog.data, ...files.data } };
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

function LoadoutBuilder({ catalog, equipment, meta }: LoadoutData) {
  const codec = useMemo(() => loadoutCodec(startingBudget(meta)), [meta]);
  const [loadout, setLoadout] = useUrlState(codec);
  const [confirmingClear, setConfirmingClear] = useState(false);

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
            onSlotChange={(slot, itemId) => setLoadout((prev) => setSlotItem(prev, slot, itemId))}
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
