import type { ReactNode } from "react";
import styles from "./Sheet.module.css";

export interface SheetSectionProps {
  title: string;
  children: ReactNode;
}

export function SheetSection({ title, children }: SheetSectionProps) {
  return (
    <section className={styles.section} aria-label={title}>
      <h3 className={styles.title}>{title}</h3>
      {children}
    </section>
  );
}

export type SheetTone = "default" | "muted" | "better" | "worse";

export interface SheetRowProps {
  label: ReactNode;
  value: ReactNode;
  tone?: SheetTone;
  total?: boolean;
}

export function SheetRow({ label, value, tone = "default", total = false }: SheetRowProps) {
  return (
    <div className={total ? `${styles.row} ${styles.total}` : styles.row}>
      <dt className={styles.label}>{label}</dt>
      <dd className={`${styles.value} ${styles[tone]}`}>{value}</dd>
    </div>
  );
}

export function SheetRows({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <dl className={styles.rows} aria-label={label}>
      {children}
    </dl>
  );
}

export function SheetNote({ children, tone = "muted" }: { children: ReactNode; tone?: SheetTone }) {
  return <p className={`${styles.note} ${styles[tone]}`}>{children}</p>;
}
