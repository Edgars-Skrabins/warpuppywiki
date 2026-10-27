import { Input, Label, SearchField, ToggleButton, ToggleButtonGroup, type Key } from "react-aria-components";
import { formatNumber } from "@/ui";
import { ARCHETYPE_FILTERS, SLOT_FILTERS, type ArsenalFilters } from "../state";
import styles from "./WeaponFilters.module.css";

export interface WeaponFiltersProps {
  filters: ArsenalFilters;
  onChange: (filters: ArsenalFilters) => void;
  resultCount: number;
}

const ALL = "all";

function selectedIds(keys: Set<Key>): string[] {
  return [...keys].map(String).filter((key) => key !== ALL);
}

export function WeaponFilters({ filters, onChange, resultCount }: WeaponFiltersProps) {
  const archetypeKeys = filters.archetypes.length === 0 ? [ALL] : filters.archetypes;

  const handleArchetypes = (keys: Set<Key>) => {
    const addedAll = keys.has(ALL) && filters.archetypes.length > 0;
    onChange({ ...filters, archetypes: addedAll ? [] : selectedIds(keys) });
  };

  return (
    <div className={styles.filters}>
      <SearchField
        value={filters.query}
        onChange={(query) => onChange({ ...filters, query })}
        className={styles.search}
      >
        <Label className={styles.label}>Search weapons</Label>
        <div className={styles.shell}>
          <Input className={styles.input} placeholder="Name or caliber" />
        </div>
      </SearchField>
      <ToggleButtonGroup
        aria-label="Weapon class"
        selectionMode="multiple"
        selectedKeys={archetypeKeys}
        onSelectionChange={handleArchetypes}
        className={styles.chips}
      >
        <ToggleButton id={ALL} className={styles.chip}>
          All
        </ToggleButton>
        {ARCHETYPE_FILTERS.map((option) => (
          <ToggleButton key={option.id} id={option.id} className={styles.chip}>
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <div className={styles.bottomRow}>
        <ToggleButtonGroup
          aria-label="Inventory slot"
          selectionMode="multiple"
          selectedKeys={filters.slots}
          onSelectionChange={(keys) => onChange({ ...filters, slots: selectedIds(keys) })}
          className={styles.chips}
        >
          {SLOT_FILTERS.map((option) => (
            <ToggleButton key={option.id} id={option.id} className={styles.chip}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <span className={styles.count} aria-live="polite">
          {resultCount === 1 ? "1 weapon" : `${formatNumber(resultCount)} weapons`}
        </span>
      </div>
    </div>
  );
}
