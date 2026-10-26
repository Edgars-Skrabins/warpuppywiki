import type { Item } from "@/core/data";
import { Button, formatCash, formatWeight, ItemIcon, NumberField } from "@/ui";
import { MAX_GEAR_QUANTITY } from "../model/loadout";
import styles from "./GearRow.module.css";

export interface GearRowProps {
  item: Item;
  quantity: number;
  unitPrice: number | null;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export function GearRow({ item, quantity, unitPrice, onQuantityChange, onRemove }: GearRowProps) {
  const weight = item.weight ?? null;
  return (
    <li className={styles.row} aria-label={item.name}>
      <ItemIcon icon={item.icon} name={item.name} size={40} />
      <span className={styles.name}>
        <span className={styles.itemName}>{item.name}</span>
        <span className={styles.unit}>{unitPrice === null ? "Not sold in shop" : `${formatCash(unitPrice)} each`}</span>
      </span>
      <NumberField
        label={`${item.name} quantity`}
        hideLabel
        minValue={0}
        maxValue={MAX_GEAR_QUANTITY}
        value={quantity}
        onChange={(value) => {
          if (!Number.isNaN(value)) onQuantityChange(value);
        }}
        className={styles.quantity}
      />
      <span className={styles.total}>{formatCash((unitPrice ?? 0) * quantity)}</span>
      <span className={styles.weight}>{weight === null ? "Weight unknown" : formatWeight(weight * quantity)}</span>
      <Button size="sm" variant="ghost" onPress={onRemove} aria-label={`Remove ${item.name}`}>
        Remove
      </Button>
    </li>
  );
}
