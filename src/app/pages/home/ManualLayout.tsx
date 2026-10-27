import { Link } from "react-router";
import { ToolStatusBadge } from "../../ToolStatusBadge";
import type { HomeLayoutProps } from "./types";
import styles from "./ManualLayout.module.css";

export function ManualLayout({ groups }: HomeLayoutProps) {
  return (
    <div className={styles.manual}>
      {groups.map((group, groupIndex) => (
        <section key={group.id} aria-labelledby={`category-${group.id}`} className={styles.chapter}>
          <div className={styles.chapterTitle}>
            <span className={styles.chapterNumber} aria-hidden="true">
              {String(groupIndex + 1).padStart(2, "0")}
            </span>
            <h2 id={`category-${group.id}`} className={styles.chapterLabel}>
              {group.label}
            </h2>
          </div>
          <ol className={styles.entries}>
            {group.tools.map((tool, toolIndex) => (
              <li key={tool.id}>
                <Link to={`/${tool.id}`} className={styles.entry}>
                  <span className={styles.entryNumber}>
                    {groupIndex + 1}.{toolIndex + 1}
                  </span>
                  <span className={styles.entryBody}>
                    <span className={styles.entryName}>
                      {tool.name}
                      <ToolStatusBadge status={tool.status} />
                    </span>
                    <span className={styles.entrySummary}>{tool.summary}</span>
                  </span>
                  <span className={styles.arrow} aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
