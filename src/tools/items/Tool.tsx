import { sameId, useCatalog, type Catalog } from "@/core/catalog";
import { useUrlState } from "@/core/state";
import { DataStateView, EmptyState } from "@/ui";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { ItemDrawer } from "./components/ItemDrawer";
import { ItemFilters } from "./components/ItemFilters";
import { ItemGrid } from "./components/ItemGrid";
import { ItemList } from "./components/ItemList";
import { buildEntries, filterEntries } from "./logic/itemEntries";
import { browserState, ITEM_PARAM } from "./state";
import styles from "./Tool.module.css";

function ItemBrowser({ catalog }: { catalog: Catalog }) {
  const [state, setState] = useUrlState(browserState);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showNonPlayer, setShowNonPlayer] = useState(false);
  const entries = useMemo(() => buildEntries(catalog), [catalog]);
  const results = useMemo(
    () => filterEntries(entries, { query: state.query, category: state.category, showNonPlayer }),
    [entries, state.query, state.category, showNonPlayer],
  );
  const selectedId = searchParams.get(ITEM_PARAM);
  const selected = selectedId === null ? undefined : entries.find((entry) => sameId(entry.item.id, selectedId));

  const setSelected = useCallback(
    (id: string | null) =>
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (id === null) {
          params.delete(ITEM_PARAM);
        } else {
          params.set(ITEM_PARAM, id);
        }
        return params;
      }),
    [setSearchParams],
  );

  return (
    <div className={styles.tool}>
      <ItemFilters
        query={state.query}
        onQueryChange={(query) => setState((prev) => ({ ...prev, query }))}
        category={state.category}
        onCategoryChange={(category) => setState((prev) => ({ ...prev, category }))}
        showNonPlayer={showNonPlayer}
        onShowNonPlayerChange={setShowNonPlayer}
        view={state.view}
        onViewChange={(view) => setState((prev) => ({ ...prev, view }))}
        resultCount={results.length}
      />
      {results.length === 0 ? (
        <EmptyState title="No items match" text="Try other words or another category." />
      ) : state.view === "list" ? (
        <ItemList entries={results} onOpen={setSelected} />
      ) : (
        <ItemGrid
          key={`${state.query}|${state.category}|${String(showNonPlayer)}`}
          entries={results}
          onOpen={setSelected}
        />
      )}
      {selected && <ItemDrawer entry={selected} catalog={catalog} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default function Tool() {
  const catalog = useCatalog();
  return <DataStateView state={catalog}>{(loaded) => <ItemBrowser catalog={loaded} />}</DataStateView>;
}
