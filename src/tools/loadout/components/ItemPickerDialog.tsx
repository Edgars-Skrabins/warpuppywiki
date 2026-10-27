import { useMemo, useState } from "react";
import { Header, Input, Label, ListBox, ListBoxItem, ListBoxSection, SearchField } from "react-aria-components";
import type { Catalog } from "@/core/catalog";
import type { Item } from "@/core/data";
import { Dialog, ItemIcon, SegmentedControl } from "@/ui";
import { pickerGroups, type PickerSort } from "../model/picker";
import { ItemFacts } from "./ItemFacts";
import styles from "./ItemPickerDialog.module.css";

const SORT_OPTIONS: { id: PickerSort; label: string }[] = [
  { id: "name", label: "Name" },
  { id: "price", label: "Price" },
  { id: "weight", label: "Weight" },
];

export interface ItemPickerDialogProps {
  title: string;
  items: readonly Item[];
  catalog: Catalog;
  groupByArchetype: boolean;
  wideIcons: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPick: (item: Item) => void;
}

export function ItemPickerDialog({
  title,
  items,
  catalog,
  groupByArchetype,
  wideIcons,
  isOpen,
  onOpenChange,
  onPick,
}: ItemPickerDialogProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<PickerSort>("name");
  const groups = useMemo(
    () => pickerGroups(items, catalog, { search, sort, groupByArchetype }),
    [items, catalog, search, sort, groupByArchetype],
  );
  const showHeaders = groupByArchetype;

  return (
    <Dialog title={title} isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
      <div className={styles.controls}>
        <SearchField value={search} onChange={setSearch} className={styles.search} autoFocus>
          <Label className={styles.label}>Search</Label>
          <Input className={styles.input} placeholder="Name or type" />
        </SearchField>
        <div className={styles.sort}>
          <span className={styles.label} aria-hidden="true">
            Sort by
          </span>
          <SegmentedControl aria-label="Sort by" size="sm" options={SORT_OPTIONS} value={sort} onChange={setSort} />
        </div>
      </div>
      <ListBox
        aria-label={title}
        items={groups}
        className={styles.list}
        onAction={(key) => {
          const item = catalog.item(String(key));
          if (item !== undefined) onPick(item);
        }}
        renderEmptyState={() => <p className={styles.empty}>No item matches</p>}
      >
        {(group) => (
          <ListBoxSection id={group.id} className={styles.section}>
            {showHeaders && <Header className={styles.groupHeader}>{group.label}</Header>}
            {group.options.map((option) => (
              <ListBoxItem
                key={option.item.id}
                id={option.item.id}
                textValue={option.item.name}
                className={styles.option}
              >
                <span className={wideIcons ? styles.wideIcon : styles.squareIcon}>
                  <ItemIcon
                    icon={option.item.icon}
                    name={option.item.name}
                    size={wideIcons ? 32 : 36}
                    shape={wideIcons ? "wide" : "square"}
                  />
                </span>
                <span className={styles.optionText}>
                  <span className={styles.optionName}>{option.item.name}</span>
                  {option.item.subtitle && <span className={styles.optionSubtitle}>{option.item.subtitle}</span>}
                </span>
                <ItemFacts price={option.price} weight={option.weight} unlock={option.unlock} />
              </ListBoxItem>
            ))}
          </ListBoxSection>
        )}
      </ListBox>
    </Dialog>
  );
}
