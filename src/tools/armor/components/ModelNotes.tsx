import styles from "./ModelNotes.module.css";

export interface ModelNotesProps {
  notes: readonly string[];
}

export function ModelNotes({ notes }: ModelNotesProps) {
  return (
    <details className={styles.notes}>
      <summary className={styles.summary}>How this is calculated</summary>
      <ul className={styles.list}>
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </details>
  );
}
