import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import { classNames } from "./classNames";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends Omit<AriaButtonProps, "className" | "style"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function Button({ variant = "secondary", size = "md", className, ...props }: ButtonProps) {
  return <AriaButton {...props} className={classNames(styles.button, styles[variant], styles[size], className)} />;
}
