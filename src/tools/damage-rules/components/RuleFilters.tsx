import { useMemo } from "react";
import { Input, Label, SearchField } from "react-aria-components";
import type { DamageRule } from "@/core/data";
import { Checkbox, ComboBox, Select, Switch } from "@/ui";
import { ENTITY_GROUPS, type EntityGroup } from "../logic/entityGroups";
import { RULE_CATEGORIES, entitiesInGroup, type RuleFilterState } from "../logic/ruleFilters";
import styles from "./RuleFilters.module.css";

export interface RuleFiltersProps {
  rules: readonly DamageRule[];
  filters: RuleFilterState;
  onChange: (patch: Partial<RuleFilterState>) => void;
}

interface Option {
  id: string;
  label: string;
}

const ALL = "";

const groupOptions: readonly Option[] = [{ id: ALL, label: "All groups" }, ...ENTITY_GROUPS];

function optionKey(option: Option): string {
  return option.id;
}

function optionLabel(option: Option): string {
  return option.label;
}

export function RuleFilters({ rules, filters, onChange }: RuleFiltersProps) {
  const entityOptions = useMemo<Option[]>(
    () => [
      { id: ALL, label: "All entities" },
      ...entitiesInGroup(rules, filters.group).map((entity) => ({ id: entity, label: entity })),
    ],
    [rules, filters.group],
  );

  const toggleCategory = (category: string, selected: boolean) => {
    const rest = filters.categories.filter((entry) => entry !== category);
    onChange({ categories: selected ? [...rest, category] : rest });
  };

  return (
    <div className={styles.filters}>
      <div className={styles.row}>
        <Select
          label="Entity group"
          items={groupOptions}
          getKey={optionKey}
          getLabel={optionLabel}
          selectedKey={filters.group ?? ALL}
          onSelectionChange={(key) =>
            onChange({ group: key === null || key === ALL ? null : (key as EntityGroup), entity: null })
          }
          className={styles.group}
        />
        <ComboBox
          label="Entity"
          items={entityOptions}
          getKey={optionKey}
          getLabel={optionLabel}
          selectedKey={filters.entity ?? ALL}
          onSelectionChange={(key) => onChange({ entity: key === null || key === ALL ? null : key })}
          className={styles.entity}
        />
        <SearchField className={styles.search} value={filters.source} onChange={(source) => onChange({ source })}>
          <Label className={styles.label}>Source tag</Label>
          <Input className={styles.input} placeholder="84mm, HollowPoint…" />
        </SearchField>
        <div className={styles.switches}>
          <Switch isSelected={filters.nonZero} onChange={(nonZero) => onChange({ nonZero })}>
            Only non-zero
          </Switch>
          <Switch isSelected={filters.hideFriendly} onChange={(hideFriendly) => onChange({ hideFriendly })}>
            Hide friendly-fire rules
          </Switch>
        </div>
      </div>
      <fieldset className={styles.categories}>
        <legend className={styles.label}>Category</legend>
        {RULE_CATEGORIES.map((category) => (
          <Checkbox
            key={category}
            isSelected={filters.categories.includes(category)}
            onChange={(selected) => toggleCategory(category, selected)}
          >
            {category}
          </Checkbox>
        ))}
      </fieldset>
    </div>
  );
}
