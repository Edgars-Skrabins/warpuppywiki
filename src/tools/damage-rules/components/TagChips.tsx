import styles from "./TagChips.module.css";

export interface TagChipsProps {
  tags: readonly string[];
}

export function TagChips({ tags }: TagChipsProps) {
  if (tags.length === 0) return <span className={styles.none}>—</span>;
  return (
    <span className={styles.chips}>
      {tags.map((tag) => {
        const cut = tag.lastIndexOf(".") + 1;
        return (
          <span key={tag} className={styles.chip} title={tag}>
            {cut > 0 && <span className={styles.prefix}>{tag.slice(0, cut)}</span>}
            {tag.slice(cut)}
          </span>
        );
      })}
    </span>
  );
}
