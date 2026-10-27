import { useEffect, useState, type ReactNode } from "react";
import { Input, SearchField } from "react-aria-components";
import { useBuilds } from "@/core/data";
import { useStoredState } from "@/core/state";
import type { ToolDefinition } from "@/core/tool";
import { EmptyState, SegmentedControl } from "@/ui";
import { buildSummary } from "../buildSummary";
import { filterTools, groupTools } from "../groupTools";
import { BriefingLayout } from "./home/BriefingLayout";
import { ColumnsLayout } from "./home/ColumnsLayout";
import { HOME_LAYOUTS, homeLayoutStore, type HomeLayoutId } from "./home/homeLayouts";
import { ManualLayout } from "./home/ManualLayout";
import { TerminalLayout } from "./home/TerminalLayout";
import { TilesLayout } from "./home/TilesLayout";
import type { HomeLayoutProps } from "./home/types";
import styles from "./HomePage.module.css";

const LAYOUT_COMPONENTS: Record<HomeLayoutId, (props: HomeLayoutProps) => ReactNode> = {
  manual: ManualLayout,
  tiles: TilesLayout,
  terminal: TerminalLayout,
  columns: ColumnsLayout,
  briefing: BriefingLayout,
};

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
  const [layout, setLayout] = useStoredState(homeLayoutStore);
  const filtered = filterTools(tools, query);
  const groups = groupTools(filtered);
  const Layout = LAYOUT_COMPONENTS[layout];

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
          <div className={styles.toolbar}>
            <SearchField aria-label="Search tools" value={query} onChange={setQuery} className={styles.search}>
              <Input placeholder="Search tools" className={styles.searchInput} />
            </SearchField>
            <div className={styles.layoutPicker}>
              <span className={styles.layoutLabel}>Layout preview</span>
              <SegmentedControl
                aria-label="Home layout"
                size="sm"
                options={HOME_LAYOUTS}
                value={layout}
                onChange={setLayout}
              />
            </div>
          </div>
          {groups.length === 0 ? <EmptyState title="No tool matches" /> : <Layout tools={filtered} groups={groups} />}
        </>
      )}
    </div>
  );
}
