import { Link } from "react-router";
import { Icon } from "@/ui";
import { categoryLabel } from "../../categories";
import { toolIcon } from "../../toolIcon";
import { ToolStatusBadge } from "../../ToolStatusBadge";
import type { HomeLayoutProps } from "./types";
import styles from "./TilesLayout.module.css";

export function TilesLayout({ groups }: HomeLayoutProps) {
  const ordered = groups.flatMap((group) => group.tools);
  return (
    <section aria-label="Tools">
      <ul className={styles.tiles}>
        {ordered.map((tool) => (
          <li key={tool.id}>
            <Link to={`/${tool.id}`} className={styles.tile}>
              <span className={styles.top}>
                <Icon name={toolIcon(tool)} size={28} className={styles.icon} />
                <ToolStatusBadge status={tool.status} />
              </span>
              <span className={styles.name}>{tool.name}</span>
              <span className={styles.summary}>{tool.summary}</span>
              <span className={styles.category}>{categoryLabel(tool.category)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
