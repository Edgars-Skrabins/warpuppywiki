import { Checkbox as AriaCheckbox, type CheckboxProps as AriaCheckboxProps } from "react-aria-components";
import { CheckIcon, MinusIcon } from "./icons";
import { classNames } from "./classNames";
import styles from "./Checkbox.module.css";

export interface CheckboxProps extends Omit<AriaCheckboxProps, "className" | "style"> {
  className?: string;
}

export function Checkbox({ className, children, ...props }: CheckboxProps) {
  return (
    <AriaCheckbox {...props} className={classNames(styles.checkbox, className)}>
      {(renderProps) => (
        <>
          <span className={styles.box} aria-hidden="true">
            {renderProps.isIndeterminate ? <MinusIcon /> : renderProps.isSelected ? <CheckIcon /> : null}
          </span>
          {typeof children === "function" ? children(renderProps) : children}
        </>
      )}
    </AriaCheckbox>
  );
}
