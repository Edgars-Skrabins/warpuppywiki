import { useEffect, useState } from "react";
import { Input, SearchField } from "react-aria-components";
import { Link } from "react-router";
import { useBuilds } from "@/core/data";
import type { ToolDefinition } from "@/core/tool";
import { EmptyState, Icon } from "@/ui";
import { buildSummary } from "../buildSummary";
import { filterTools, groupTools } from "../groupTools";
import { toolIcon } from "../toolIcon";
import { ToolStatusBadge } from "../ToolStatusBadge";
import styles from "./HomePage.module.css";

function BuildLine() {
  const builds = useBuilds();
  return (
    <p className={styles.build}>
      <span className={styles.buildMarker} aria-hidden="true" />
      {builds.status === "success" ? buildSummary(builds.data) : "Game build …"}
    </p>
  );
}

function ToolCard({ tool }: { tool: ToolDefinition }) {
  return (
    <Link to={`/${tool.id}`} className={styles.card}>
      <span className={styles.cardIcon}>
        <Icon name={toolIcon(tool)} size={24} />
      </span>
      <span className={styles.cardText}>
        <span className={styles.cardName}>
          {tool.name}
          <ToolStatusBadge status={tool.status} />
        </span>
        <span className={styles.cardSummary}>{tool.summary}</span>
      </span>
    </Link>
  );
}

export function HomePage({ tools }: { tools: readonly ToolDefinition[] }) {
  const [query, setQuery] = useState("");
  const groups = groupTools(filterTools(tools, query));

  useEffect(() => {
    document.title = "warpuppywiki";
  }, []);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>warpuppywiki</h1>
        <p className={styles.lede}>Unofficial tools for Wardogs, built from the game&apos;s own data</p>
        <BuildLine />
      </section>
      {tools.length === 0 ? (
        <EmptyState title="No tools yet" />
      ) : (
        <>
          <SearchField aria-label="Search tools" value={query} onChange={setQuery} className={styles.search}>
            <Input placeholder="Search tools" className={styles.searchInput} />
          </SearchField>
          {groups.length === 0 ? (
            <EmptyState title="No tool matches" />
          ) : (
            groups.map((group) => (
              <section key={group.id} aria-labelledby={`category-${group.id}`} className={styles.group}>
                <div className={styles.groupHeader}>
                  <h2 id={`category-${group.id}`} className={styles.groupTitle}>
                    {group.label}
                  </h2>
                  <span className={styles.groupCount} aria-hidden="true">
                    {String(group.tools.length).padStart(2, "0")}
                  </span>
                </div>
                <ul className={styles.cards}>
                  {group.tools.map((tool) => (
                    <li key={tool.id}>
                      <ToolCard tool={tool} />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </>
      )}
    </div>
  );
}
