import { Badge, formatCash, ItemIcon } from "@/ui";
import { useId } from "react";
import { itemName, NON_PLAYER_LABELS, type ItemEntry } from "../logic/itemEntries";
import { UnlockBadge } from "./UnlockBadge";
import styles from "./ItemCard.module.css";

interface ItemCardProps {
  entry: ItemEntry;
  onOpen: (id: string) => void;
}

export function ItemCard({ entry, onOpen }: ItemCardProps) {
  const { item, price, unlock, nonPlayer } = entry;
  const detailsId = useId();
  const name = itemName(item);
  return (
    <button
      type="button"
      aria-label={name}
      aria-describedby={detailsId}
      className={styles.card}
      onClick={() => onOpen(item.id)}
    >
      <span className={styles.art}>
        <ItemIcon icon={item.icon} name={name} size={88} shape="wide" className={styles.icon} />
      </span>
      <span id={detailsId} className={styles.body}>
        <span className={styles.name}>{name}</span>
        {item.subtitle && <span className={styles.subtitle}>{item.subtitle}</span>}
        <span className={styles.footer}>
          <span className={price ? styles.price : styles.notSold}>
            {price ? formatCash(price.price) : "Not sold in shop"}
            {price && price.amount > 1 && <span className={styles.lot}> × {price.amount}</span>}
          </span>
          <span className={styles.badges}>
            {nonPlayer && <Badge tone="warning">{NON_PLAYER_LABELS[nonPlayer]}</Badge>}
            <UnlockBadge unlock={unlock} />
          </span>
        </span>
      </span>
    </button>
  );
}
