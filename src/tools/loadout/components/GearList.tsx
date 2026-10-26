import { useMemo, useState } from "react";
import { sameId, type Catalog } from "@/core/catalog";
import { Button, EmptyState, Panel } from "@/ui";
import { gearItems } from "../model/gear";
import { MAX_GEAR_QUANTITY, MAX_GEAR_ROWS, type Loadout } from "../model/loadout";
import { GearRow } from "./GearRow";
import { ItemPickerDialog } from "./ItemPickerDialog";
import styles from "./GearList.module.css";

export interface GearListProps {
  loadout: Loadout;
  catalog: Catalog;
  onQuantityChange: (itemId: string, quantity: number) => void;
}

export function GearList({ loadout, catalog, onQuantityChange }: GearListProps) {
  const [picking, setPicking] = useState(false);
  const items = useMemo(() => gearItems(catalog), [catalog]);
  const rows = loadout.gear.flatMap((entry) => {
    const item = catalog.item(entry.itemId);
    return item === undefined ? [] : [{ item, quantity: entry.quantity }];
  });

  return (
    <Panel
      title="Gear"
      description="Consumables and utility items"
      actions={
        <Button size="sm" onPress={() => setPicking(true)} isDisabled={loadout.gear.length >= MAX_GEAR_ROWS}>
          Add gear
        </Button>
      }
    >
      {rows.length === 0 ? (
        <EmptyState title="No gear" text="Add bandages, grenades and other utility items." />
      ) : (
        <ul className={styles.list} aria-label="Gear">
          {rows.map(({ item, quantity }) => (
            <GearRow
              key={item.id}
              item={item}
              quantity={quantity}
              unitPrice={catalog.price(item.id)?.price ?? null}
              onQuantityChange={(next) => onQuantityChange(item.id, next)}
              onRemove={() => onQuantityChange(item.id, 0)}
            />
          ))}
        </ul>
      )}
      {picking && (
        <ItemPickerDialog
          title="Add gear"
          items={items}
          catalog={catalog}
          groupByArchetype={false}
          wideIcons={false}
          isOpen
          onOpenChange={setPicking}
          onPick={(item) => {
            const current = loadout.gear.find((entry) => sameId(entry.itemId, item.id))?.quantity ?? 0;
            onQuantityChange(item.id, Math.min(MAX_GEAR_QUANTITY, current + 1));
            setPicking(false);
          }}
        />
      )}
    </Panel>
  );
}
