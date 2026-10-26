import { useId, type HTMLAttributes, type ReactNode } from "react";
import { classNames } from "./classNames";
import styles from "./Panel.module.css";

export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 2 | 3 | 4;
}

export function Panel({ title, description, actions, headingLevel = 2, className, children, ...props }: PanelProps) {
  const headingId = useId();
  const Heading = `h${headingLevel}` as const;
  return (
    <section {...props} aria-labelledby={headingId} className={classNames(styles.panel, className)}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <Heading id={headingId} className={styles.title}>
            {title}
          </Heading>
          {description !== undefined && <p className={styles.description}>{description}</p>}
        </div>
        {actions !== undefined && <div className={styles.actions}>{actions}</div>}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
