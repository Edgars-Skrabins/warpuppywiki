import type { LootTable } from "@/core/data";
import { spawnRules } from "../logic/spawnRules";
import styles from "./SpawnRules.module.css";

export function SpawnRules({ table }: { table: LootTable }) {
  return (
    <ul className={styles.rules} aria-label="Spawn rules">
      {spawnRules(table).map((rule) => (
        <li key={rule} className={styles.rule}>
          {rule}
        </li>
      ))}
    </ul>
  );
}
