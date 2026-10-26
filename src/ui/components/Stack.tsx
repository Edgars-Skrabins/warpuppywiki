import type { CSSProperties, HTMLAttributes } from "react";
import { classNames } from "./classNames";
import { spaceVar, type SpaceToken } from "./space";
import styles from "./Stack.module.css";

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: "vertical" | "horizontal";
  gap?: SpaceToken;
  align?: CSSProperties["alignItems"];
  justify?: CSSProperties["justifyContent"];
  wrap?: boolean;
}

export function Stack({
  direction = "vertical",
  gap = 3,
  align,
  justify,
  wrap = false,
  className,
  style,
  ...props
}: StackProps) {
  return (
    <div
      {...props}
      className={classNames(styles.stack, styles[direction], wrap && styles.wrap, className)}
      style={{ gap: spaceVar(gap), alignItems: align, justifyContent: justify, ...style }}
    />
  );
}
