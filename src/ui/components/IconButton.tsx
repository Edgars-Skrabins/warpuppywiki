import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import type { ButtonSize, ButtonVariant } from "./Button";
import { classNames } from "./classNames";
import buttonStyles from "./Button.module.css";
import styles from "./IconButton.module.css";

export interface IconButtonProps extends Omit<AriaButtonProps, "className" | "style" | "aria-label"> {
  "aria-label": string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function IconButton({ variant = "ghost", size = "md", className, ...props }: IconButtonProps) {
  return (
    <AriaButton
      {...props}
      className={classNames(buttonStyles.button, buttonStyles[variant], styles.iconButton, styles[size], className)}
    />
  );
}
