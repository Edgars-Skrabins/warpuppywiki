import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { useCatalog, type Catalog } from "@/core/catalog";
import { useGameDataMany, type DamageFile, type DataState, type EquipmentFile, type MetaFile } from "@/core/data";
import { useUrlState } from "@/core/state";
import { useWeaponIndex, type WeaponIndex } from "@/core/weapons";
import { Button, DataStateView, Dialog, LoadingState, Panel } from "@/ui";
import { GearList } from "./components/GearList";
import { LethalityPanel } from "./components/LethalityPanel";
import { LoadoutToolbar } from "./components/LoadoutToolbar";
import { MyLoadoutsDialog } from "./components/MyLoadoutsDialog";
import { NameField } from "./components/NameField";
import { SharedBanner } from "./components/SharedBanner";
import { SlotGrid } from "./components/SlotGrid";
import { SummaryPanel } from "./components/SummaryPanel";
import {
  emptyLoadout,
  setGearQuantity,
  setLethalityView,
  setSlotItem,
  setWeaponSetup,
  startingBudget,
  type Loadout,
  type SlotId,
} from "./model/loadout";
import { SLOT_DEFINITIONS, slotDefinition } from "./model/slots";
import { kitStatSources } from "./model/totals";
import { defaultSetup, validateLoadout } from "./model/weaponSetup";
import { sameContent, type SavedLoadout } from "./saves/savedLoadouts";
import { useSavedLoadouts } from "./saves/useSavedLoadouts";
import { loadoutCodec, shareLink, useLoadoutLink } from "./state";
import styles from "./Tool.module.css";

const LIMIT_MESSAGE = "You have 100 saved loadouts. Delete some to save more.";
const TOO_LARGE_MESSAGE = "This loadout is too large to share as a link";

const LOADOUT_FILES = ["equipment", "meta", "damage"] as const;

interface LoadoutData {
  catalog: Catalog;
  equipment: EquipmentFile;
  meta: MetaFile;
  damage: DamageFile;
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

function LoadoutBuilder({ catalog, equipment, meta, damage, index }: LoadoutData) {
  const defaultBudget = startingBudget(meta);
  const codec = useMemo(() => loadoutCodec(defaultBudget), [defaultBudget]);
  const [decoded, setDecoded] = useUrlState(codec);
  const validation = useMemo(() => validateLoadout(decoded, index), [decoded, index]);
  const loadout = validation.loadout;
  const setLoadout = useCallback(
    (update: (prev: Loadout) => Loadout) => setDecoded((prev) => update(validateLoadout(prev, index).loadout)),
    [setDecoded, index],
  );
  const kitSources = useMemo(() => kitStatSources(loadout, catalog, equipment), [loadout, catalog, equipment]);
  const lethalityModel = useMemo(() => ({ index, damage, equipment }), [index, damage, equipment]);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [confirmingNew, setConfirmingNew] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [link, setLink] = useLoadoutLink();
  const saves = useSavedLoadouts();
  const location = useLocation();
  const savedCopy = saves.find(link.savedId);
  const dirty = !sameContent(loadout, savedCopy?.loadout ?? emptyLoadout(defaultBudget));

  const reportSave = (result: ReturnType<typeof saves.save> | null) => {
    if (result === null) return null;
    if (!result.ok) {
      setStatus(LIMIT_MESSAGE);
      return null;
    }
    setStatus(null);
    setLink({ savedId: result.saved.id, shared: false });
    return result.saved;
  };

  const save = () => {
    reportSave(saves.save(savedCopy?.id ?? null, loadout));
  };

  const saveAsNew = () => {
    const saved = reportSave(saves.saveAsNew(loadout));
    if (saved !== null) setLoadout((prev) => ({ ...prev, name: saved.name }));
  };

  const openSaved = (saved: SavedLoadout) => {
    setLoadout(() => saved.loadout);
    setLink({ savedId: saved.id, shared: false });
    setStatus(null);
    setLibraryOpen(false);
  };

  const startNew = () => {
    setLoadout((prev) => ({ ...emptyLoadout(defaultBudget), view: prev.view }));
    setLink({ savedId: null, shared: false });
    setStatus(null);
  };

  const share = () => {
    const result = shareLink(codec, loadout, window.location.href, location.pathname);
    if (!result.ok) {
      setStatus(TOO_LARGE_MESSAGE);
      return;
    }
    navigator.clipboard.writeText(result.url).then(
      () => setStatus("Link copied"),
      () => setStatus("Could not copy the link"),
    );
  };

  const changeSlot = (slot: SlotId, itemId: string | null) =>
    setLoadout((prev) =>
      itemId !== null && slotDefinition(slot).kind === "weapon"
        ? setWeaponSetup(prev, slot, defaultSetup(itemId, index, catalog))
        : setSlotItem(prev, slot, itemId),
    );

  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <div className={styles.header}>
          <NameField value={loadout.name} onChange={(name) => setLoadout((prev) => ({ ...prev, name }))} />
          <LoadoutToolbar
            saved={savedCopy !== null}
            dirty={dirty}
            status={status}
            onSave={save}
            onSaveAsNew={saveAsNew}
            onOpenLibrary={() => setLibraryOpen(true)}
            onShare={share}
            onNew={() => (dirty ? setConfirmingNew(true) : startNew())}
          />
        </div>
        {link.shared && <SharedBanner onSave={save} />}
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
        <LethalityPanel
          loadout={loadout}
          model={lethalityModel}
          onViewChange={(changes) => setLoadout((prev) => setLethalityView(prev, changes))}
        />
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
                setLoadout((prev) => ({ ...emptyLoadout(prev.budget), name: prev.name, view: prev.view }));
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
      <Dialog
        title="Discard unsaved changes?"
        role="alertdialog"
        size="sm"
        isOpen={confirmingNew}
        onOpenChange={setConfirmingNew}
        actions={(close) => (
          <>
            <Button variant="ghost" onPress={close}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onPress={() => {
                startNew();
                close();
              }}
            >
              Discard
            </Button>
          </>
        )}
      >
        <p>This starts an empty loadout. Changes that are not saved are lost.</p>
      </Dialog>
      <MyLoadoutsDialog
        entries={saves.entries}
        catalog={catalog}
        equipment={equipment}
        currentId={savedCopy?.id ?? null}
        isOpen={libraryOpen}
        onOpenChange={setLibraryOpen}
        onOpenLoadout={openSaved}
        onDuplicate={(id) => {
          const result = saves.duplicate(id);
          if (result !== null && !result.ok) setStatus(LIMIT_MESSAGE);
        }}
        onRename={(id, name) => {
          saves.rename(id, name);
          if (id === savedCopy?.id) setLoadout((prev) => ({ ...prev, name }));
        }}
        onDelete={(key) => {
          saves.remove(key);
          if (key === savedCopy?.id) setLink({ savedId: null, shared: link.shared });
        }}
      />
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
