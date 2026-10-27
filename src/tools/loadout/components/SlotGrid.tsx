import { useState } from "react";
import type { Catalog } from "@/core/catalog";
import { slotItemId, type Loadout, type SlotId } from "../model/loadout";
import { itemsForSlot, SLOT_DEFINITIONS, slotDefinition } from "../model/slots";
import { ItemPickerDialog } from "./ItemPickerDialog";
import { SlotCard } from "./SlotCard";
import styles from "./SlotGrid.module.css";

export interface SlotGridProps {
  loadout: Loadout;
  catalog: Catalog;
  onSlotChange: (slot: SlotId, itemId: string | null) => void;
}

export function SlotGrid({ loadout, catalog, onSlotChange }: SlotGridProps) {
  const [picking, setPicking] = useState<SlotId | null>(null);
  const pickingSlot = picking === null ? null : slotDefinition(picking);

  return (
    <div className={styles.grid}>
      {SLOT_DEFINITIONS.map((slot) => {
        const itemId = slotItemId(loadout, slot.id);
        return (
          <SlotCard
            key={slot.id}
            slot={slot}
            item={(itemId === null ? undefined : catalog.item(itemId)) ?? null}
            catalog={catalog}
            onChoose={() => setPicking(slot.id)}
            onRemove={() => onSlotChange(slot.id, null)}
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
    </div>
  );
}
