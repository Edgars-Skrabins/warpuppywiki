import { summarizeChanges } from "../diff/summarize";
import type { FieldChange } from "../diff/types";
import styles from "./ChangeSummary.module.css";

export const VISIBLE_SUMMARIES = 3;

export interface ChangeSummaryProps {
  changes: readonly FieldChange[];
}

export function ChangeSummary({ changes }: ChangeSummaryProps) {
  const summaries = summarizeChanges(changes);
  const hidden = summaries.length - VISIBLE_SUMMARIES;
  return (
    <ul className={styles.summary}>
      {summaries.slice(0, VISIBLE_SUMMARIES).map((summary, index) => (
        <li key={index} className={styles.item}>
          {summary}
        </li>
      ))}
      {hidden > 0 && <li className={styles.more}>+{hidden} more</li>}
    </ul>
  );
}
