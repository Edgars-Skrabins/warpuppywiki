import type { ReactNode } from "react";
import { Button } from "./Button";
import { AlertIcon } from "./icons";
import { classNames } from "./classNames";
import styles from "./StateMessage.module.css";

export interface ErrorStateProps {
  title: ReactNode;
  text?: ReactNode;
  details?: readonly ReactNode[];
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({ title, text, details, onRetry, retryLabel = "Try again", className }: ErrorStateProps) {
  return (
    <div role="alert" className={classNames(styles.message, styles.error, className)}>
      <span className={styles.icon} aria-hidden="true">
        <AlertIcon />
      </span>
      <p className={styles.title}>{title}</p>
      {text !== undefined && <p className={styles.text}>{text}</p>}
      {details !== undefined && details.length > 0 && (
        <ul className={styles.details}>
          {details.map((detail, index) => (
            <li key={index}>{detail}</li>
          ))}
        </ul>
      )}
      {onRetry && (
        <div className={styles.action}>
          <Button variant="secondary" size="sm" onPress={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
