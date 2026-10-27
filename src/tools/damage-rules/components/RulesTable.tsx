import { useState, type UIEvent } from "react";
import type { IndexedRule, RuleSort, RuleSortKey } from "../logic/ruleFilters";
import { operationLabel, ruleAmountText } from "../logic/ruleAmount";
import { TagChips } from "./TagChips";
import styles from "./RulesTable.module.css";

export const ROW_HEIGHT = 36;
const VIEWPORT_HEIGHT = 576;
const BUFFER_ROWS = 10;

export interface RulesTableProps {
  rows: readonly IndexedRule[];
  sort: RuleSort;
  onSortChange: (sort: RuleSort) => void;
  applying: ReadonlySet<number> | null;
}

interface SortHeaderProps {
  label: string;
  sortKey: RuleSortKey;
  sort: RuleSort;
  onSortChange: (sort: RuleSort) => void;
  className?: string;
}

function SortHeader({ label, sortKey, sort, onSortChange, className }: SortHeaderProps) {
  const active = sort.key === sortKey;
  const ariaSort = active ? (sort.descending ? "descending" : "ascending") : "none";
  return (
    <div role="columnheader" aria-sort={ariaSort} className={className ?? styles.header}>
      <button
        type="button"
        className={styles.sortButton}
        data-active={active || undefined}
        onClick={() => onSortChange({ key: sortKey, descending: active ? !sort.descending : false })}
      >
        {label}
        <span aria-hidden="true" className={styles.sortMark}>
          {active ? (sort.descending ? "▼" : "▲") : ""}
        </span>
      </button>
    </div>
  );
}

export function RulesTable({ rows, sort, onSortChange, applying }: RulesTableProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
  const last = Math.min(rows.length, Math.ceil((scrollTop + VIEWPORT_HEIGHT) / ROW_HEIGHT) + BUFFER_ROWS);
  const visible = rows.slice(first, last);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => setScrollTop(event.currentTarget.scrollTop);

  return (
    <div
      role="table"
      aria-label="Damage rules"
      aria-rowcount={rows.length + 1}
      className={styles.table}
      data-marking={applying !== null || undefined}
      style={{ maxHeight: VIEWPORT_HEIGHT }}
      onScroll={handleScroll}
    >
      <div role="rowgroup" className={styles.head}>
        <div role="row" aria-rowindex={1} className={styles.row}>
          <SortHeader label="#" sortKey="file" sort={sort} onSortChange={onSortChange} className={styles.headerEnd} />
          {applying !== null && (
            <div role="columnheader" className={styles.header}>
              Applies
            </div>
          )}
          <SortHeader label="Entity" sortKey="entity" sort={sort} onSortChange={onSortChange} />
          <div role="columnheader" className={styles.header}>
            Category
          </div>
          <div role="columnheader" className={styles.header}>
            Source
          </div>
          <div role="columnheader" className={styles.header}>
            Target
          </div>
          <div role="columnheader" className={styles.header}>
            Attacker
          </div>
          <div role="columnheader" className={styles.header}>
            Hit locations
          </div>
          <div role="columnheader" className={styles.header}>
            Operation
          </div>
          <SortHeader
            label="Amount"
            sortKey="amount"
            sort={sort}
            onSortChange={onSortChange}
            className={styles.headerEnd}
          />
          <div role="columnheader" className={styles.header}>
            Custom code
          </div>
        </div>
      </div>
      <div role="rowgroup" className={styles.body} style={{ height: rows.length * ROW_HEIGHT }}>
        {rows.length === 0 && <div className={styles.empty}>No rules match these filters.</div>}
        <div className={styles.window} style={{ transform: `translateY(${first * ROW_HEIGHT}px)` }}>
          {visible.map(({ index, rule }, offset) => {
            const applies = applying?.has(index);
            return (
              <div
                key={index}
                role="row"
                aria-rowindex={first + offset + 2}
                className={styles.row}
                data-applies={applies === undefined ? undefined : String(applies)}
              >
                <div role="cell" className={styles.cellEnd}>
                  {index}
                </div>
                {applying !== null && (
                  <div role="cell" className={styles.cell}>
                    <span className={applies ? styles.appliesYes : styles.appliesNo}>{applies ? "Applies" : "No"}</span>
                  </div>
                )}
                <div role="cell" className={styles.cell}>
                  <TagChips tags={[rule.entity]} />
                </div>
                <div role="cell" className={styles.cell}>
                  {rule.category}
                </div>
                <div role="cell" className={styles.cell}>
                  <TagChips tags={rule.source} />
                </div>
                <div role="cell" className={styles.cell}>
                  <TagChips tags={rule.target} />
                </div>
                <div role="cell" className={styles.cell}>
                  <TagChips tags={rule.instigator} />
                </div>
                <div role="cell" className={styles.cell}>
                  <TagChips tags={rule.hitLocations} />
                </div>
                <div role="cell" className={styles.cellMuted}>
                  {operationLabel(rule)}
                </div>
                <div role="cell" className={styles.amount} data-sign={Math.sign(rule.amount)}>
                  {ruleAmountText(rule)}
                </div>
                <div role="cell" className={styles.cellMuted} title={rule.custom ?? undefined}>
                  {rule.custom ?? "—"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
