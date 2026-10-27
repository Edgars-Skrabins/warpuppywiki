import { modelNotes } from "@/core/damage";
import styles from "./Results.module.css";

export interface ModelNotesProps {
  build: string;
}

export function ModelNotes({ build }: ModelNotesProps) {
  return (
    <details className={styles.notes}>
      <summary className={styles.notesSummary}>How this is calculated</summary>
      <ul className={styles.notesList}>
        {modelNotes(build).map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </details>
  );
}
