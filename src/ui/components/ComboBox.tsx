import {
  Button as AriaButton,
  Collection,
  ComboBox as AriaComboBox,
  Group,
  Header,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Popover,
  Text,
  type Key,
} from "react-aria-components";
import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { CheckIcon, ChevronDownIcon } from "./icons";
import { classNames } from "./classNames";
import styles from "./Field.module.css";

export interface ComboBoxProps<T> {
  label: string;
  items: readonly T[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  getSearchText?: (item: T) => string;
  getGroup?: (item: T) => string;
  renderOption?: (item: T) => ReactNode;
  selectedKey: string | null;
  onSelectionChange: (key: string | null, item: T | null) => void;
  placeholder?: string;
  description?: ReactNode;
  emptyText?: string;
  isDisabled?: boolean;
  hideLabel?: boolean;
  className?: string;
}

interface OptionEntry<T> {
  id: string;
  item: T;
}

interface SectionEntry<T> {
  id: string;
  name: string;
  options: OptionEntry<T>[];
}

type Entry<T> = ({ kind: "option" } & OptionEntry<T>) | ({ kind: "section" } & SectionEntry<T>);

function filterItems<T>(items: readonly T[], query: string, getSearchText: (item: T) => string): readonly T[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return items;
  return items.filter((item) => getSearchText(item).toLowerCase().includes(needle));
}

function groupEntries<T>(
  items: readonly T[],
  getKey: (item: T) => string,
  getGroup: ((item: T) => string) | undefined,
): Entry<T>[] {
  if (!getGroup) return items.map((item) => ({ kind: "option", id: getKey(item), item }));
  const sections = new Map<string, SectionEntry<T>>();
  for (const item of items) {
    const name = getGroup(item);
    let section = sections.get(name);
    if (!section) {
      section = { id: `section:${name}`, name, options: [] };
      sections.set(name, section);
    }
    section.options.push({ id: getKey(item), item });
  }
  return [...sections.values()].map((section) => ({ kind: "section", ...section }));
}

export function ComboBox<T>({
  label,
  items,
  getKey,
  getLabel,
  getSearchText,
  getGroup,
  renderOption,
  selectedKey,
  onSelectionChange,
  placeholder,
  description,
  emptyText = "No matches",
  isDisabled,
  hideLabel = false,
  className,
}: ComboBoxProps<T>) {
  const selectedItem = useMemo(
    () => (selectedKey === null ? null : (items.find((item) => getKey(item) === selectedKey) ?? null)),
    [items, getKey, selectedKey],
  );
  const selectedLabel = selectedItem ? getLabel(selectedItem) : "";

  const [inputValue, setInputValue] = useState(selectedLabel);
  const [filterText, setFilterText] = useState("");
  const [syncedLabel, setSyncedLabel] = useState(selectedLabel);

  if (syncedLabel !== selectedLabel) {
    setSyncedLabel(selectedLabel);
    setInputValue(selectedLabel);
    setFilterText("");
  }

  const deferredFilterText = useDeferredValue(filterText);
  const searchText = getSearchText ?? getLabel;
  const filtered = useMemo(
    () => filterItems(items, deferredFilterText, searchText),
    [items, deferredFilterText, searchText],
  );
  const entries = useMemo(() => groupEntries(filtered, getKey, getGroup), [filtered, getKey, getGroup]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setFilterText(value);
  };

  const handleOpenChange = (isOpen: boolean, trigger?: string) => {
    if (isOpen && trigger !== "input") setFilterText("");
  };

  const handleChange = (key: Key | null) => {
    if (key === null) {
      if (selectedKey !== null) onSelectionChange(null, null);
      return;
    }
    const id = String(key);
    const item = items.find((candidate) => getKey(candidate) === id) ?? null;
    if (item) {
      setInputValue(getLabel(item));
      setFilterText("");
    }
    onSelectionChange(id, item);
  };

  const renderItem = (option: OptionEntry<T>) => (
    <ListBoxItem id={option.id} textValue={getLabel(option.item)} className={styles.option}>
      <span className={styles.optionContent}>
        {renderOption ? renderOption(option.item) : <span className={styles.optionLabel}>{getLabel(option.item)}</span>}
      </span>
      <CheckIcon className={styles.optionCheck} />
    </ListBoxItem>
  );

  return (
    <AriaComboBox
      className={classNames(styles.field, className)}
      items={entries}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      value={selectedKey}
      onChange={handleChange}
      onOpenChange={handleOpenChange}
      isDisabled={isDisabled}
      allowsEmptyCollection
      aria-label={hideLabel ? label : undefined}
    >
      {!hideLabel && <Label className={styles.label}>{label}</Label>}
      <Group className={styles.shell}>
        <Input className={styles.input} placeholder={placeholder} />
        <AriaButton className={styles.shellButton}>
          <ChevronDownIcon />
        </AriaButton>
      </Group>
      {description !== undefined && (
        <Text slot="description" className={styles.description}>
          {description}
        </Text>
      )}
      <Popover className={styles.popover} offset={4}>
        <ListBox<Entry<T>>
          className={styles.listBox}
          renderEmptyState={() => <div className={styles.empty}>{emptyText}</div>}
        >
          {(entry) =>
            entry.kind === "section" ? (
              <ListBoxSection id={entry.id} className={styles.section}>
                <Header className={styles.sectionHeader}>{entry.name}</Header>
                <Collection items={entry.options}>{renderItem}</Collection>
              </ListBoxSection>
            ) : (
              renderItem(entry)
            )
          }
        </ListBox>
      </Popover>
    </AriaComboBox>
  );
}

export interface OptionContentProps {
  label: ReactNode;
  secondary?: ReactNode;
  icon?: ReactNode;
}

export function OptionContent({ label, secondary, icon }: OptionContentProps) {
  return (
    <span className={styles.optionWithIcon}>
      {icon !== undefined && <span className={styles.optionIcon}>{icon}</span>}
      <span className={styles.optionContent}>
        <span className={styles.optionLabel}>{label}</span>
        {secondary !== undefined && <span className={styles.optionSecondary}>{secondary}</span>}
      </span>
    </span>
  );
}
