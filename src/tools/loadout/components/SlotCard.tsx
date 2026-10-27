import type { Catalog } from "@/core/catalog";
import type { Item } from "@/core/data";
import { Button, ItemIcon } from "@/ui";
import type { SlotDefinition } from "../model/slots";
import { ItemFacts } from "./ItemFacts";
import styles from "./SlotCard.module.css";

export interface SlotCardProps {
  slot: SlotDefinition;
  item: Item | null;
  catalog: Catalog;
  summary?: string | null;
  showNotice?: boolean;
  onChoose: () => void;
  onRemove: () => void;
  onCustomize?: () => void;
}

export function SlotCard({
  slot,
  item,
  catalog,
  summary = null,
  showNotice = false,
  onChoose,
  onRemove,
  onCustomize,
}: SlotCardProps) {
  const subtitle = item === null ? null : (catalog.archetype(item)?.label ?? item.subtitle ?? null);
  return (
    <article className={styles.card} aria-label={slot.label} data-filled={item !== null || undefined}>
      <header className={styles.header}>
        <h3 className={styles.slotLabel}>{slot.label}</h3>
        {item !== null && subtitle !== null && <span className={styles.subtitle}>{subtitle}</span>}
      </header>
      <div className={styles.art}>
        {item === null ? (
          <span className={styles.empty}>Empty</span>
        ) : (
          <ItemIcon
            icon={item.icon}
            name={item.name}
            size={88}
            shape={slot.kind === "weapon" ? "wide" : "square"}
            className={slot.kind === "weapon" ? styles.wideArt : undefined}
          />
        )}
      </div>
      <div className={styles.body}>
        {item !== null && (
          <>
            <p className={styles.name}>{item.name}</p>
            <ItemFacts
              price={catalog.price(item.id)?.price ?? null}
              weight={item.weight ?? null}
              unlock={catalog.unlock(item)}
            />
            {summary !== null && <p className={styles.summary}>{summary}</p>}
          </>
        )}
        {showNotice && (
          <p role="status" className={styles.notice}>
            Some parts of this setup no longer fit and were removed
          </p>
        )}
      </div>
      <footer className={styles.actions}>
        {item === null ? (
          <Button size="sm" onPress={onChoose} aria-label={`Choose ${slot.label}`}>
            Choose
          </Button>
        ) : (
          <>
            {onCustomize !== undefined && (
              <Button size="sm" onPress={onCustomize} aria-label={`Customize ${slot.label}`}>
                Customize
              </Button>
            )}
            <Button size="sm" onPress={onChoose} aria-label={`Change ${slot.label}`}>
              Change
            </Button>
            <Button size="sm" variant="ghost" onPress={onRemove} aria-label={`Remove ${slot.label}`}>
              Remove
            </Button>
          </>
        )}
      </footer>
    </article>
  );
}
