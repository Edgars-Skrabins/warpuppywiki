import type { UnlockInfo } from "@/core/catalog";
import { Badge, formatCash, formatWeight } from "@/ui";
import styles from "./ItemFacts.module.css";

function unlockText(unlock: UnlockInfo): string {
  return `${unlock.roleLabel} ${unlock.level}`;
}

export interface ItemFactsProps {
  price: number | null;
  weight: number | null;
  unlock: UnlockInfo | null;
}

export function ItemFacts({ price, weight, unlock }: ItemFactsProps) {
  return (
    <span className={styles.facts}>
      <span className={price === null ? styles.muted : styles.value}>
        {price === null ? "Not sold in shop" : formatCash(price)}
      </span>
      <span className={weight === null ? styles.muted : styles.value}>
        {weight === null ? "Weight unknown" : formatWeight(weight)}
      </span>
      {unlock !== null && <Badge tone="warning">{unlockText(unlock)}</Badge>}
    </span>
  );
}
