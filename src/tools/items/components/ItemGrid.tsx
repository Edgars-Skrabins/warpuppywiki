import { useEffect, useRef, useState } from "react";
import type { ItemEntry } from "../logic/itemEntries";
import { ItemCard } from "./ItemCard";
import styles from "./ItemGrid.module.css";

export const GRID_PAGE_SIZE = 60;

interface ItemGridProps {
  entries: readonly ItemEntry[];
  onOpen: (id: string) => void;
}

export function ItemGrid({ entries, onOpen }: ItemGridProps) {
  const [visible, setVisible] = useState(GRID_PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = visible < entries.length;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!hasMore || sentinel === null || typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(
      (observed) => {
        if (observed.some((entry) => entry.isIntersecting)) {
          setVisible((count) => count + GRID_PAGE_SIZE);
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, visible]);

  return (
    <>
      <ul className={styles.grid} aria-label="Items">
        {entries.slice(0, visible).map((entry) => (
          <li key={entry.item.id} className={styles.cell}>
            <ItemCard entry={entry} onOpen={onOpen} />
          </li>
        ))}
      </ul>
      {hasMore && <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />}
    </>
  );
}
