import type { ReactNode } from "react";
import { Focusable } from "react-aria-components";
import { Tooltip } from "@/ui";
import styles from "./Hint.module.css";

export interface HintProps {
  content: ReactNode;
  children: ReactNode;
}

export function Hint({ content, children }: HintProps) {
  return (
    <Tooltip content={content}>
      <Focusable>
        <span role="button" tabIndex={0} className={styles.hint}>
          {children}
        </span>
      </Focusable>
    </Tooltip>
  );
}
