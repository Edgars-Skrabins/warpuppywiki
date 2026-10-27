import { Link } from "react-router";
import { ToolStatusBadge } from "../../ToolStatusBadge";
import type { HomeLayoutProps } from "./types";
import styles from "./ColumnsLayout.module.css";

export function ColumnsLayout({ groups }: HomeLayoutProps) {
  return (
    <div className={styles.columns}>
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`category-${group.id}`} className={styles.column}>
          <h2 id={`category-${group.id}`} className={styles.title}>
            {group.label}
          </h2>
          <ul className={styles.list}>
            {group.tools.map((tool) => (
              <li key={tool.id}>
                <Link to={`/${tool.id}`} className={styles.link}>
                  <span className={styles.name}>
                    {tool.name}
                    <ToolStatusBadge status={tool.status} />
                  </span>
                  <span className={styles.summary}>{tool.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
