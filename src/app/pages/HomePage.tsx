import { useEffect, useState } from "react";
import { Input, SearchField } from "react-aria-components";
import { useBuilds } from "@/core/data";
import type { ToolDefinition } from "@/core/tool";
import { EmptyState } from "@/ui";
import { buildSummary } from "../buildSummary";
import { filterTools } from "../groupTools";
import { BriefingLayout } from "./home/BriefingLayout";
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

export function HomePage({ tools }: { tools: readonly ToolDefinition[] }) {
  const [query, setQuery] = useState("");
  const filtered = filterTools(tools, query);

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
          {filtered.length === 0 ? <EmptyState title="No tool matches" /> : <BriefingLayout tools={filtered} />}
        </>
      )}
    </div>
  );
}
