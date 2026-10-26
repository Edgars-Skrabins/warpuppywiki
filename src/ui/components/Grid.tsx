import type { HTMLAttributes } from "react";
import { classNames } from "./classNames";
import { spaceVar, type SpaceToken } from "./space";
import styles from "./Grid.module.css";

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  minColumnWidth?: number;
  gap?: SpaceToken;
}

export function Grid({ minColumnWidth = 240, gap = 4, className, style, ...props }: GridProps) {
  return (
    <div
      {...props}
      className={classNames(styles.grid, className)}
      style={{
        gap: spaceVar(gap),
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${minColumnWidth}px, 100%), 1fr))`,
        ...style,
      }}
    />
  );
}
