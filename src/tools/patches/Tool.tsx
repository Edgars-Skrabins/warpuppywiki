import { useMemo } from "react";
import { useBuilds } from "@/core/data";
import { DataStateView, Switch, formatNumber } from "@/ui";
import { BuildPickers } from "./components/BuildPickers";
import { CategoryView } from "./components/CategoryView";
import { NothingToCompare } from "./components/NothingToCompare";
import { SummaryCards } from "./components/SummaryCards";
import { CATEGORY_DEFINITIONS } from "./diff/categories";
import { useBuildFiles } from "./hooks/useBuildFiles";
import { categoryResult } from "./hooks/useCategoryDiff";
import { sortBuilds, usePatchState, type BuildInfo, type PatchState } from "./state";
import styles from "./Tool.module.css";

const ALL_FILES = [...new Set(CATEGORY_DEFINITIONS.flatMap((definition) => definition.files))];

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
  const open = results.find((result) => result.definition.id === state.category);
  return (
    <div className={styles.tool}>
      <div className={styles.toolbar}>
        <BuildPickers builds={builds} from={state.from} to={state.to} onChange={update} />
        <Switch isSelected={state.showAssets} onChange={(showAssets) => update({ showAssets })}>
          Show file path changes
        </Switch>
      </div>
      {files.loaded < files.total && (
        <p className={styles.progress} role="status">
          Comparing {formatNumber(files.loaded)} of {formatNumber(files.total)} files
        </p>
      )}
      {open ? (
        <CategoryView
          result={open}
          filter={state.filter}
          search={state.search}
          onFilterChange={(filter) => update({ filter })}
          onSearchChange={(search) => update({ search })}
          onBack={() => update({ category: null, filter: "all", search: "" })}
        />
      ) : (
        <SummaryCards results={results} onOpen={(category) => update({ category })} />
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
