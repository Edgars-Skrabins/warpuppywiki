import { Input, SearchField } from "react-aria-components";
import { Button, EmptyState, ErrorState, LoadingState, Panel, SegmentedControl, formatNumber } from "@/ui";
import type { EntityDiff } from "../diff/types";
import { toMarkdown } from "../export/markdown";
import type { CategoryResult } from "../hooks/useCategoryDiff";
import { filterEntities, type EntityFilter } from "../state";
import styles from "./CategoryView.module.css";
import { CopyMarkdownButton } from "./CopyMarkdownButton";
import { EntityRow } from "./EntityRow";

export interface CategoryViewProps {
  result: CategoryResult;
  filter: EntityFilter;
  search: string;
  onFilterChange: (filter: EntityFilter) => void;
  onSearchChange: (search: string) => void;
  onBack: () => void;
  hrefFor: (entity: EntityDiff) => string;
  builds: { from: string; to: string };
}

const FILTER_LABELS: Record<EntityFilter, string> = {
  all: "All",
  added: "Added",
  removed: "Removed",
  changed: "Changed",
};

function CategoryBody({
  result,
  filter,
  search,
  onFilterChange,
  onSearchChange,
  hrefFor,
}: Omit<CategoryViewProps, "onBack" | "builds">) {
  if (result.status === "loading") {
    return <LoadingState label={`Comparing ${result.definition.label.toLowerCase()}`} />;
  }
  if (result.status === "error") {
    return <ErrorState title={`Couldn't compare ${result.definition.label.toLowerCase()}`} details={result.errors} />;
  }
  const { diff } = result;
  const counts: Record<EntityFilter, number> = { all: diff.entities.length, ...diff.counts };
  const entities = filterEntities(diff.entities, filter, search);
  return (
    <div className={styles.body}>
      {diff.notes.map((note) => (
        <p key={note} className={styles.note}>
          {note}
        </p>
      ))}
      <div className={styles.controls}>
        <SegmentedControl
          aria-label="Show"
          options={(Object.keys(FILTER_LABELS) as EntityFilter[]).map((id) => ({
            id,
            label: `${FILTER_LABELS[id]} ${formatNumber(counts[id])}`,
          }))}
          value={filter}
          onChange={onFilterChange}
        />
        <SearchField
          aria-label="Search by name or id"
          value={search}
          onChange={onSearchChange}
          className={styles.search}
        >
          <Input placeholder="Search by name or id" className={styles.searchInput} />
        </SearchField>
      </div>
      {entities.length === 0 ? (
        <EmptyState title={diff.entities.length === 0 ? "No changes" : "Nothing matches"} />
      ) : (
        <ul className={styles.list} aria-label={diff.label}>
          {entities.map((entity) => (
            <EntityRow key={entity.key} entity={entity} href={hrefFor(entity)} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function CategoryView({ onBack, builds, ...props }: CategoryViewProps) {
  const { result } = props;
  return (
    <Panel
      title={result.definition.label}
      actions={
        <>
          <CopyMarkdownButton
            isDisabled={result.status !== "success"}
            getText={() => (result.status === "success" ? toMarkdown([result.diff], builds) : "")}
          />
          <Button variant="ghost" size="sm" onPress={onBack}>
            All categories
          </Button>
        </>
      }
    >
      <CategoryBody {...props} />
    </Panel>
  );
}
