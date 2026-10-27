import { Link } from "react-router";
import { Button, Panel } from "@/ui";
import type { NotableLine } from "../impact/notable";
import styles from "./NotableChanges.module.css";

export interface NotableChangesProps {
  lines: readonly NotableLine[];
  isComplete: boolean;
  hrefFor: (line: NotableLine) => string;
  onShowAll: () => void;
}

export function NotableChanges({ lines, isComplete, hrefFor, onShowAll }: NotableChangesProps) {
  return (
    <Panel
      title="Notable changes"
      actions={
        <Button variant="ghost" size="sm" onPress={onShowAll}>
          Show all
        </Button>
      }
    >
      {lines.length === 0 ? (
        <p className={styles.muted}>
          {isComplete ? "No buffs, nerfs or new weapons, vehicles or armor." : "Comparing…"}
        </p>
      ) : (
        <ul className={styles.list} aria-label="Notable changes">
          {lines.map((line) => (
            <li key={`${line.categoryId}|${line.entityKey ?? line.filter}|${line.text}`}>
              <Link to={hrefFor(line)} className={styles.link}>
                {line.text}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
