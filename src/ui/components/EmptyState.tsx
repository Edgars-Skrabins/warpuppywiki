import type { ReactNode } from "react";
import { InboxIcon } from "./icons";
import { classNames } from "./classNames";
import styles from "./StateMessage.module.css";

export interface EmptyStateProps {
  title: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({ title, text, action, icon, className }: EmptyStateProps) {
  return (
    <div className={classNames(styles.message, className)}>
      <span className={styles.icon} aria-hidden="true">
        {icon ?? <InboxIcon />}
      </span>
      <p className={styles.title}>{title}</p>
      {text !== undefined && <p className={styles.text}>{text}</p>}
      {action !== undefined && <div className={styles.action}>{action}</div>}
    </div>
  );
}
