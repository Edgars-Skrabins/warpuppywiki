import type { Key } from "react-aria-components";
import {
  Button as AriaButton,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue,
  Text,
} from "react-aria-components";
import type { ReactNode } from "react";
import { CheckIcon, ChevronDownIcon } from "./icons";
import { classNames } from "./classNames";
import styles from "./Field.module.css";

export interface SelectProps<T> {
  label: string;
  items: readonly T[];
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  renderOption?: (item: T) => ReactNode;
  selectedKey: string | null;
  onSelectionChange: (key: string | null, item: T | null) => void;
  placeholder?: string;
  description?: ReactNode;
  isDisabled?: boolean;
  hideLabel?: boolean;
  className?: string;
}

export function Select<T>({
  label,
  items,
  getKey,
  getLabel,
  renderOption,
  selectedKey,
  onSelectionChange,
  placeholder = "Select…",
  description,
  isDisabled,
  hideLabel = false,
  className,
}: SelectProps<T>) {
  const handleChange = (key: Key | null) => {
    if (key === null) {
      onSelectionChange(null, null);
      return;
    }
    const id = String(key);
    onSelectionChange(id, items.find((item) => getKey(item) === id) ?? null);
  };

  return (
    <AriaSelect
      className={classNames(styles.field, className)}
      value={selectedKey}
      onChange={handleChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      aria-label={hideLabel ? label : undefined}
    >
      {!hideLabel && <Label className={styles.label}>{label}</Label>}
      <AriaButton className={styles.trigger}>
        <SelectValue className={styles.value}>
          {({ isPlaceholder, selectedText }) => (isPlaceholder ? placeholder : selectedText)}
        </SelectValue>
        <ChevronDownIcon className={styles.chevron} />
      </AriaButton>
      {description !== undefined && (
        <Text slot="description" className={styles.description}>
          {description}
        </Text>
      )}
      <Popover className={styles.popover} offset={4}>
        <ListBox className={styles.listBox}>
          {items.map((item) => (
            <ListBoxItem key={getKey(item)} id={getKey(item)} textValue={getLabel(item)} className={styles.option}>
              <span className={styles.optionContent}>
                {renderOption ? renderOption(item) : <span className={styles.optionLabel}>{getLabel(item)}</span>}
              </span>
              <CheckIcon className={styles.optionCheck} />
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}
