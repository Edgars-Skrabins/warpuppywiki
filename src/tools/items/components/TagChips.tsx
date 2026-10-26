import type { Catalog } from "@/core/catalog";
import styles from "./TagChips.module.css";

interface TagChipsProps {
  tags: readonly string[];
  catalog: Catalog;
}

export function TagChips({ tags, catalog }: TagChipsProps) {
  return (
    <ul className={styles.chips} aria-label="Tags">
      {tags.map((tag) => {
        const text = catalog.tagText(tag);
        return (
          <li key={tag} className={styles.chip}>
            <span className={styles.tag}>{tag}</span>
            {text && <span className={styles.text}>{text}</span>}
          </li>
        );
      })}
    </ul>
  );
}
