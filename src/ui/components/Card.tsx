import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "./classNames";
import styles from "./Card.module.css";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  raised?: boolean;
}

export function Card({ raised = false, className, ...props }: CardProps) {
  return <div {...props} className={classNames(styles.card, raised && styles.raised, className)} />;
}

export interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function CardHeader({ title, subtitle, actions, className, children, ...props }: CardHeaderProps) {
  return (
    <div {...props} className={classNames(styles.header, className)}>
      <div className={styles.headerText}>
        {title !== undefined && <h3 className={styles.title}>{title}</h3>}
        {subtitle !== undefined && <p className={styles.subtitle}>{subtitle}</p>}
        {children}
      </div>
      {actions !== undefined && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={classNames(styles.body, className)} />;
}
