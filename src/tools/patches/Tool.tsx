import { useMemo } from "react";
import { useBuilds } from "@/core/data";
import { DataStateView, Switch, formatNumber } from "@/ui";
import { BuildPickers } from "./components/BuildPickers";
import { CategoryView } from "./components/CategoryView";
import { CopyMarkdownButton } from "./components/CopyMarkdownButton";
import { EntityDetail } from "./components/EntityDetail";
import { NotableChanges } from "./components/NotableChanges";
import { NothingToCompare } from "./components/NothingToCompare";
import { SummaryCards } from "./components/SummaryCards";
import { CATEGORY_DEFINITIONS } from "./diff/categories";
import type { CategoryDiff } from "./diff/types";
import { toMarkdown } from "./export/markdown";
import { useBuildFiles } from "./hooks/useBuildFiles";
import { categoryResult, type CategoryResult } from "./hooks/useCategoryDiff";
import { notableChanges, type NotableLine } from "./impact/notable";
import { patchSearch, sortBuilds, usePatchState, type BuildInfo, type PatchState } from "./state";
import styles from "./Tool.module.css";

const ALL_FILES = [...new Set(CATEGORY_DEFINITIONS.flatMap((definition) => definition.files))];

function successfulDiffs(results: readonly CategoryResult[]): CategoryDiff[] {
  return results.flatMap((result) => (result.status === "success" ? [result.diff] : []));
}

interface ComparisonProps {
  builds: readonly BuildInfo[];
  state: PatchState;
  update: (patch: Partial<PatchState>) => void;
}

function Comparison({ builds, state, update }: ComparisonProps) {
  const files = useBuildFiles(ALL_FILES, state.from, state.to);
  const results = useMemo(
    () => CATEGORY_DEFINITIONS.map((definition) => categoryResult(definition, files, state.showAssets)),
    [files, state.showAssets],
  );
  const diffs = useMemo(() => successfulDiffs(results), [results]);
  const notable = useMemo(() => notableChanges(diffs), [diffs]);
  const complete = files.loaded === files.total;
  const open = results.find((result) => result.definition.id === state.category);
  const lineHref = (line: NotableLine) =>
    patchSearch(state, { category: line.categoryId, entity: line.entityKey, filter: line.filter ?? "all", search: "" });
  return (
    <div className={styles.tool}>
      <div className={styles.toolbar}>
        <BuildPickers builds={builds} from={state.from} to={state.to} onChange={update} />
        <Switch isSelected={state.showAssets} onChange={(showAssets) => update({ showAssets })}>
          Show file path changes
        </Switch>
        <CopyMarkdownButton
          isDisabled={!complete}
          getText={() => toMarkdown(diffs, { from: state.from, to: state.to })}
        />
      </div>
      {files.loaded < files.total && (
        <p className={styles.progress} role="status">
          Comparing {formatNumber(files.loaded)} of {formatNumber(files.total)} files
        </p>
      )}
      {open && state.entity !== null ? (
        <EntityDetail result={open} entityKey={state.entity} onBack={() => update({ entity: null })} />
      ) : open ? (
        <CategoryView
          result={open}
          builds={{ from: state.from, to: state.to }}
          hrefFor={(entity) => patchSearch(state, { entity: entity.key })}
          filter={state.filter}
          search={state.search}
          onFilterChange={(filter) => update({ filter })}
          onSearchChange={(search) => update({ search })}
          onBack={() => update({ category: null, entity: null, filter: "all", search: "" })}
        />
      ) : (
        <>
          <NotableChanges
            lines={notable}
            isComplete={complete}
            hrefFor={lineHref}
            onShowAll={() => update({ category: "weapons" })}
          />
          <SummaryCards results={results} onOpen={(category) => update({ category })} />
        </>
      )}
    </div>
  );
}

function PatchDiff({ builds }: { builds: readonly BuildInfo[] }) {
  const sorted = useMemo(() => sortBuilds(builds), [builds]);
  const [state, update] = usePatchState(sorted);
  return state ? <Comparison builds={sorted} state={state} update={update} /> : <NothingToCompare />;
}

export default function Tool() {
  const builds = useBuilds();
  return <DataStateView state={builds}>{(file) => <PatchDiff builds={file.builds} />}</DataStateView>;
}
