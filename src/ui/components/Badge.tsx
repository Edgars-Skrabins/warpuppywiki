import type { HTMLAttributes } from "react";
import { classNames } from "./classNames";
import styles from "./Badge.module.css";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger" | "tag";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return <span {...props} className={classNames(styles.badge, styles[tone], className)} />;
}
