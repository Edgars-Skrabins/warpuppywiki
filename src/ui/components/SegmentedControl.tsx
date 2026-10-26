import type { Key } from "react-aria-components";
import { ToggleButton, ToggleButtonGroup } from "react-aria-components";
import type { ReactNode } from "react";
import { classNames } from "./classNames";
import styles from "./SegmentedControl.module.css";

export interface SegmentedOption<K extends string> {
  id: K;
  label: ReactNode;
  ariaLabel?: string;
  isDisabled?: boolean;
}

export interface SegmentedControlProps<K extends string> {
  "aria-label": string;
  options: readonly SegmentedOption<K>[];
  value: K;
  onChange: (value: K) => void;
  size?: "sm" | "md";
  isDisabled?: boolean;
  className?: string;
}

export function SegmentedControl<K extends string>({
  options,
  value,
  onChange,
  size = "md",
  isDisabled,
  className,
  ...props
}: SegmentedControlProps<K>) {
  const handleChange = (keys: Set<Key>) => {
    const [next] = keys;
    const option = options.find((candidate) => candidate.id === next);
    if (option) onChange(option.id);
  };

  return (
    <ToggleButtonGroup
      aria-label={props["aria-label"]}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[value]}
      onSelectionChange={handleChange}
      isDisabled={isDisabled}
      className={classNames(styles.group, styles[size], className)}
    >
      {options.map((option) => (
        <ToggleButton
          key={option.id}
          id={option.id}
          aria-label={option.ariaLabel}
          isDisabled={option.isDisabled}
          className={styles.segment}
        >
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
