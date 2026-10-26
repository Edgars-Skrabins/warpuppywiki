import styles from "./MissingImagery.module.css";

export function MissingImagery() {
  return (
    <div className={styles.notice} role="status">
      <p className={styles.title}>Map imagery isn't installed</p>
      {import.meta.env.DEV && (
        <p className={styles.hint}>
          Run <code>pnpm assets:sync</code>.
        </p>
      )}
    </div>
  );
}
