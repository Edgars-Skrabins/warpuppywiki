import { Link } from "react-router";
import { Badge } from "@/ui";
import type { EntityDiff } from "../diff/types";
import { ChangeSummary } from "./ChangeSummary";
import styles from "./EntityRow.module.css";
import { STATUS_BADGES } from "./statusBadges";

export interface EntityRowProps {
  entity: EntityDiff;
  href: string;
}

export function EntityRow({ entity, href }: EntityRowProps) {
  const badge = STATUS_BADGES[entity.status];
  return (
    <li className={styles.row}>
      <Link to={href} className={styles.link}>
        <div className={styles.heading}>
          <span className={styles.name}>{entity.name}</span>
          <Badge tone={badge.tone}>{badge.label}</Badge>
        </div>
        {entity.changes.length > 0 && <ChangeSummary changes={entity.changes} />}
      </Link>
    </li>
  );
}
