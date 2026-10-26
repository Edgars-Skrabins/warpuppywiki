import { Badge, type BadgeTone } from "@/ui";
import type { EntityDiff, EntityStatus } from "../diff/types";
import { ChangeSummary } from "./ChangeSummary";
import styles from "./EntityRow.module.css";

const STATUS_BADGES: Record<EntityStatus, { label: string; tone: BadgeTone }> = {
  added: { label: "Added", tone: "success" },
  removed: { label: "Removed", tone: "danger" },
  changed: { label: "Changed", tone: "info" },
};

export interface EntityRowProps {
  entity: EntityDiff;
}

export function EntityRow({ entity }: EntityRowProps) {
  const badge = STATUS_BADGES[entity.status];
  return (
    <li className={styles.row}>
      <div className={styles.heading}>
        <span className={styles.name}>{entity.name}</span>
        <Badge tone={badge.tone}>{badge.label}</Badge>
      </div>
      {entity.changes.length > 0 && <ChangeSummary changes={entity.changes} />}
    </li>
  );
}
