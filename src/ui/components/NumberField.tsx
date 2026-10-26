import {
  Button as AriaButton,
  Group,
  Input,
  Label,
  NumberField as AriaNumberField,
  Text,
  type NumberFieldProps as AriaNumberFieldProps,
} from "react-aria-components";
import type { ReactNode } from "react";
import { MinusIcon, PlusIcon } from "./icons";
import { classNames } from "./classNames";
import fieldStyles from "./Field.module.css";
import styles from "./NumberField.module.css";

export interface NumberFieldProps extends Omit<AriaNumberFieldProps, "className" | "style" | "children"> {
  label: string;
  unit?: string;
  description?: ReactNode;
  hideLabel?: boolean;
  hideStepper?: boolean;
  className?: string;
}

export function NumberField({
  label,
  unit,
  description,
  hideLabel = false,
  hideStepper = false,
  className,
  ...props
}: NumberFieldProps) {
  return (
    <AriaNumberField
      {...props}
      aria-label={hideLabel ? label : undefined}
      className={classNames(fieldStyles.field, className)}
    >
      {!hideLabel && <Label className={fieldStyles.label}>{label}</Label>}
      <Group className={fieldStyles.shell}>
        {!hideStepper && (
          <AriaButton slot="decrement" className={classNames(fieldStyles.shellButton, styles.decrement)}>
            <MinusIcon />
          </AriaButton>
        )}
        <Input className={classNames(fieldStyles.input, styles.input)} />
        {unit !== undefined && (
          <span className={styles.unit} aria-hidden="true">
            {unit}
          </span>
        )}
        {!hideStepper && (
          <AriaButton slot="increment" className={fieldStyles.shellButton}>
            <PlusIcon />
          </AriaButton>
        )}
      </Group>
      {description !== undefined && (
        <Text slot="description" className={fieldStyles.description}>
          {description}
        </Text>
      )}
    </AriaNumberField>
  );
}
