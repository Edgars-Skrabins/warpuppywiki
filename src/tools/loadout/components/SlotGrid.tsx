import { useState } from "react";
import type { Catalog } from "@/core/catalog";
import type { ModifierSource } from "@/core/modifiers";
import type { WeaponIndex } from "@/core/weapons";
import { slotItemId, weaponSetupOf, type Loadout, type SlotId, type WeaponSetup } from "../model/loadout";
import { itemsForSlot, SLOT_DEFINITIONS, slotDefinition } from "../model/slots";
import { setupSummaryText } from "../model/weaponSetup";
import { ItemPickerDialog } from "./ItemPickerDialog";
import { SlotCard } from "./SlotCard";
import { WeaponSetupPanel } from "./WeaponSetupPanel";
import styles from "./SlotGrid.module.css";

export interface SlotGridProps {
  loadout: Loadout;
  catalog: Catalog;
  index: WeaponIndex;
  kitSources: readonly ModifierSource[];
  notices: readonly SlotId[];
  onSlotChange: (slot: SlotId, itemId: string | null) => void;
  onSetupChange: (slot: SlotId, setup: WeaponSetup) => void;
}

export function SlotGrid({ loadout, catalog, index, kitSources, notices, onSlotChange, onSetupChange }: SlotGridProps) {
  const [picking, setPicking] = useState<SlotId | null>(null);
  const [customizing, setCustomizing] = useState<SlotId | null>(null);
  const pickingSlot = picking === null ? null : slotDefinition(picking);
  const customizingSetup = customizing === null ? null : weaponSetupOf(loadout, customizing);
  const customizingWeapon = customizingSetup === null ? undefined : index.weapon(customizingSetup.itemId);

  return (
    <div className={styles.grid}>
      {SLOT_DEFINITIONS.map((slot) => {
        const itemId = slotItemId(loadout, slot.id);
        const setup = weaponSetupOf(loadout, slot.id);
        const weapon = setup === null ? undefined : index.weapon(setup.itemId);
        return (
          <SlotCard
            key={slot.id}
            slot={slot}
            item={(itemId === null ? undefined : catalog.item(itemId)) ?? null}
            catalog={catalog}
            summary={setup === null || weapon === undefined ? null : setupSummaryText(setup, index, catalog)}
            showNotice={notices.includes(slot.id)}
            onChoose={() => setPicking(slot.id)}
            onRemove={() => onSlotChange(slot.id, null)}
            onCustomize={weapon === undefined ? undefined : () => setCustomizing(slot.id)}
          />
        );
      })}
      {pickingSlot !== null && (
        <ItemPickerDialog
          title={`Choose ${pickingSlot.label.toLowerCase()}`}
          items={itemsForSlot(pickingSlot, catalog)}
          catalog={catalog}
          groupByArchetype={pickingSlot.kind === "weapon"}
          wideIcons={pickingSlot.kind === "weapon"}
          isOpen
          onOpenChange={(open) => {
            if (!open) setPicking(null);
          }}
          onPick={(item) => {
            onSlotChange(pickingSlot.id, item.id);
            setPicking(null);
          }}
        />
      )}
      {customizing !== null && customizingSetup !== null && customizingWeapon !== undefined && (
        <WeaponSetupPanel
          slotLabel={slotDefinition(customizing).label}
          weapon={customizingWeapon}
          setup={customizingSetup}
          index={index}
          catalog={catalog}
          kitSources={kitSources}
          onChange={(setup) => onSetupChange(customizing, setup)}
          onClose={() => setCustomizing(null)}
        />
      )}
    </div>
  );
}
