import { VisuallyHidden } from "react-aria-components";
import { classNames } from "./classNames";
import styles from "./LoadingState.module.css";

export interface LoadingStateProps {
  label?: string;
  lines?: number;
  variant?: "lines" | "block";
  height?: number | string;
  className?: string;
}

const lineWidths = ["100%", "92%", "84%", "96%", "72%", "88%"];

export function LoadingState({
  label = "Loading…",
  lines = 3,
  variant = "lines",
  height,
  className,
}: LoadingStateProps) {
  return (
    <div role="status" aria-busy="true" className={classNames(styles.loading, className)}>
      <VisuallyHidden>{label}</VisuallyHidden>
      {variant === "block" ? (
        <div className={styles.skeleton} style={{ height: height ?? 160 }} aria-hidden="true" />
      ) : (
        Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={classNames(styles.skeleton, styles.line)}
            style={{ width: lineWidths[index % lineWidths.length] }}
            aria-hidden="true"
          />
        ))
      )}
    </div>
  );
}
