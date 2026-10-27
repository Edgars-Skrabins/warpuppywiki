import { formatNumber } from "@/ui";
import type { CategoryCounts } from "../diff/types";
import type { CategoryResult } from "../hooks/useCategoryDiff";
import styles from "./SummaryCards.module.css";

export interface SummaryCardsProps {
  results: readonly CategoryResult[];
  onOpen: (categoryId: string) => void;
}

const COUNT_LABELS: { key: keyof CategoryCounts; label: string; className: string }[] = [
  { key: "added", label: "Added", className: styles.added! },
  { key: "removed", label: "Removed", className: styles.removed! },
  { key: "changed", label: "Changed", className: styles.changed! },
];

function hasChanges(result: CategoryResult): boolean {
  return result.status !== "success" || result.diff.entities.length > 0 || result.diff.notes.length > 0;
}

function CardBody({ result }: { result: CategoryResult }) {
  if (result.status === "loading") {
    return <p className={styles.muted}>Comparing…</p>;
  }
  if (result.status === "error") {
    return (
      <ul className={styles.errors}>
        {result.errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    );
  }
  return (
    <>
      <dl className={styles.counts}>
        {COUNT_LABELS.map(({ key, label, className }) => (
          <div key={key} className={styles.count}>
            <dt className={styles.countLabel}>{label}</dt>
            <dd className={`${styles.countValue} ${result.diff.counts[key] > 0 ? className : styles.zero}`}>
              {formatNumber(result.diff.counts[key])}
            </dd>
          </div>
        ))}
      </dl>
      {result.diff.notes.map((note) => (
        <p key={note} className={styles.note}>
          {note}
        </p>
      ))}
    </>
  );
}

export function SummaryCards({ results, onOpen }: SummaryCardsProps) {
  const changed = results.filter(hasChanges);
  const unchanged = results.filter((result) => !hasChanges(result));
  return (
    <div className={styles.summary}>
      <ul className={styles.grid} aria-label="Categories">
        {changed.map((result) => (
          <li key={result.definition.id}>
            <button
              type="button"
              className={styles.card}
              onClick={() => onOpen(result.definition.id)}
              disabled={result.status === "loading"}
            >
              <span className={styles.label}>{result.definition.label}</span>
              <CardBody result={result} />
            </button>
          </li>
        ))}
      </ul>
      {unchanged.length > 0 && (
        <details className={styles.unchanged}>
          <summary className={styles.unchangedSummary}>No changes ({unchanged.length})</summary>
          <ul className={styles.unchangedList}>
            {unchanged.map((result) => (
              <li key={result.definition.id}>{result.definition.label}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
