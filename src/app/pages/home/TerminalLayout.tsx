import { Link } from "react-router";
import { Icon } from "@/ui";
import { categoryLabel } from "../../categories";
import { toolIcon } from "../../toolIcon";
import { ToolStatusBadge } from "../../ToolStatusBadge";
import type { HomeLayoutProps } from "./types";
import styles from "./TerminalLayout.module.css";

export function TerminalLayout({ groups }: HomeLayoutProps) {
  const ordered = groups.flatMap((group) => group.tools);
  return (
    <section aria-label="Tools" className={styles.terminal}>
      <div className={styles.head} aria-hidden="true">
        <span>Tool</span>
        <span>Purpose</span>
        <span>Section</span>
      </div>
      <ul className={styles.rows}>
        {ordered.map((tool) => (
          <li key={tool.id}>
            <Link to={`/${tool.id}`} className={styles.row}>
              <span className={styles.name}>
                <Icon name={toolIcon(tool)} size={16} className={styles.icon} />
                {tool.name}
                <ToolStatusBadge status={tool.status} />
              </span>
              <span className={styles.summary}>{tool.summary}</span>
              <span className={styles.category}>{categoryLabel(tool.category)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
