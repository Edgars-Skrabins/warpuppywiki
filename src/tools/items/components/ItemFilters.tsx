import { formatNumber, SegmentedControl, Switch } from "@/ui";
import { Input, Label, SearchField, ToggleButton, ToggleButtonGroup, type Key } from "react-aria-components";
import { ITEM_CATEGORIES, type ItemCategory } from "../logic/itemCategory";
import styles from "./ItemFilters.module.css";

export type ItemView = "grid" | "list";

interface ItemFiltersProps {
  query: string;
  onQueryChange: (query: string) => void;
  category: ItemCategory | "all";
  onCategoryChange: (category: ItemCategory | "all") => void;
  showNonPlayer: boolean;
  onShowNonPlayerChange: (show: boolean) => void;
  view: ItemView;
  onViewChange: (view: ItemView) => void;
  resultCount: number;
}

const CHIPS: readonly { id: ItemCategory | "all"; label: string }[] = [{ id: "all", label: "All" }, ...ITEM_CATEGORIES];

const VIEWS = [
  { id: "grid", label: "Grid" },
  { id: "list", label: "List" },
] as const;

export function ItemFilters({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  showNonPlayer,
  onShowNonPlayerChange,
  view,
  onViewChange,
  resultCount,
}: ItemFiltersProps) {
  const handleCategory = (keys: Set<Key>) => {
    const [next] = keys;
    const chip = CHIPS.find((candidate) => candidate.id === next);
    if (chip) onCategoryChange(chip.id);
  };

  return (
    <div className={styles.filters}>
      <div className={styles.topRow}>
        <SearchField value={query} onChange={onQueryChange} className={styles.search}>
          <Label className={styles.label}>Search items</Label>
          <div className={styles.shell}>
            <Input className={styles.input} placeholder="Name, description or id" />
          </div>
        </SearchField>
        <SegmentedControl aria-label="View" options={VIEWS} value={view} onChange={onViewChange} />
      </div>
      <ToggleButtonGroup
        aria-label="Category"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[category]}
        onSelectionChange={handleCategory}
        className={styles.chips}
      >
        {CHIPS.map((chip) => (
          <ToggleButton key={chip.id} id={chip.id} className={styles.chip}>
            {chip.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <div className={styles.bottomRow}>
        <Switch isSelected={showNonPlayer} onChange={onShowNonPlayerChange}>
          Show non-player items
        </Switch>
        <span className={styles.count} aria-live="polite">
          {resultCount === 1 ? "1 item" : `${formatNumber(resultCount)} items`}
        </span>
      </div>
    </div>
  );
}
