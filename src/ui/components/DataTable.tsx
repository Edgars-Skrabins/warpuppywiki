import {
  Cell,
  Column as AriaColumn,
  Row,
  Table,
  TableBody,
  TableHeader,
  type ColumnProps,
  type SortDescriptor,
} from "react-aria-components";
import { useMemo, useState, type ReactNode } from "react";
import { EMPTY_VALUE, formatNumber } from "../format";
import type { BetterWhen } from "./StatDelta";
import { classNames } from "./classNames";
import styles from "./DataTable.module.css";

export type SortDirection = "ascending" | "descending";

export interface Column<T> {
  key: string;
  header: ReactNode;
  value: (row: T) => string | number | null;
  render?: (row: T) => ReactNode;
  align?: "start" | "end";
  sortable?: boolean;
  betterWhen?: BetterWhen;
  width?: ColumnProps["width"];
}

export interface DataTableSort {
  column: string;
  direction: SortDirection;
}

export interface DataTableProps<T> {
  "aria-label": string;
  columns: readonly Column<T>[];
  rows: readonly T[];
  getRowKey: (row: T) => string;
  initialSort?: DataTableSort;
  onRowClick?: (row: T) => void;
  emptyText: ReactNode;
  maxHeight?: number | string;
  className?: string;
}

interface RowEntry<T> {
  id: string;
  row: T;
}

function compareValues(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "en-US", { numeric: true, sensitivity: "base" });
}

function sortRows<T>(rows: readonly T[], value: (row: T) => string | number | null, direction: SortDirection): T[] {
  const sign = direction === "ascending" ? 1 : -1;
  return rows
    .map((row, index) => ({ row, index, value: value(row) }))
    .sort((a, b) => {
      if (a.value === null || b.value === null) {
        if (a.value === b.value) return a.index - b.index;
        return a.value === null ? 1 : -1;
      }
      return sign * compareValues(a.value, b.value) || a.index - b.index;
    })
    .map((entry) => entry.row);
}

function bestValue<T>(rows: readonly T[], column: Column<T>): number | null {
  if (column.betterWhen !== "higher" && column.betterWhen !== "lower") return null;
  const values = rows.map(column.value).filter((value): value is number => typeof value === "number");
  if (values.length < 2) return null;
  const best = column.betterWhen === "higher" ? Math.max(...values) : Math.min(...values);
  return values.every((value) => value === best) ? null : best;
}

function columnAlign<T>(column: Column<T>, rows: readonly T[]): "start" | "end" {
  if (column.align) return column.align;
  for (const row of rows) {
    const value = column.value(row);
    if (value !== null) return typeof value === "number" ? "end" : "start";
  }
  return "start";
}

function defaultCell(value: string | number | null): ReactNode {
  if (value === null) return EMPTY_VALUE;
  return typeof value === "number" ? formatNumber(value) : value;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  initialSort,
  onRowClick,
  emptyText,
  maxHeight = "70vh",
  className,
  ...props
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortDescriptor | undefined>(
    initialSort ? { column: initialSort.column, direction: initialSort.direction } : undefined,
  );

  const sortColumn = columns.find((column) => column.key === sort?.column && column.sortable);

  const entries = useMemo<RowEntry<T>[]>(() => {
    const sorted = sortColumn && sort ? sortRows(rows, sortColumn.value, sort.direction) : rows;
    return sorted.map((row) => ({ id: getRowKey(row), row }));
  }, [rows, sortColumn, sort, getRowKey]);

  const meta = useMemo(
    () =>
      new Map(
        columns.map((column) => [column.key, { align: columnAlign(column, rows), best: bestValue(rows, column) }]),
      ),
    [columns, rows],
  );

  return (
    <div className={classNames(styles.container, className)} style={{ maxHeight }}>
      <Table
        aria-label={props["aria-label"]}
        sortDescriptor={sort}
        onSortChange={setSort}
        onRowAction={
          onRowClick
            ? (key) => {
                const entry = entries.find((candidate) => candidate.id === key);
                if (entry) onRowClick(entry.row);
              }
            : undefined
        }
        className={classNames(styles.table, onRowClick && styles.clickable)}
      >
        <TableHeader columns={columns} className={styles.header}>
          {(column) => (
            <AriaColumn
              id={column.key}
              isRowHeader={column.key === columns[0]?.key}
              allowsSorting={column.sortable}
              width={column.width}
              className={classNames(styles.column, meta.get(column.key)?.align === "end" && styles.end)}
            >
              {({ allowsSorting, sortDirection }) => (
                <span className={styles.columnContent}>
                  <span>{column.header}</span>
                  {allowsSorting && (
                    <span
                      className={classNames(styles.sortIndicator, sortDirection && styles.sorted)}
                      aria-hidden="true"
                    >
                      {sortDirection === "descending" ? "▼" : "▲"}
                    </span>
                  )}
                </span>
              )}
            </AriaColumn>
          )}
        </TableHeader>
        <TableBody items={entries} renderEmptyState={() => <div className={styles.empty}>{emptyText}</div>}>
          {(entry) => (
            <Row id={entry.id} columns={columns} className={styles.row}>
              {(column) => {
                const columnMeta = meta.get(column.key);
                const value = column.value(entry.row);
                const isBest = columnMeta?.best !== null && columnMeta?.best !== undefined && value === columnMeta.best;
                return (
                  <Cell
                    className={classNames(
                      styles.cell,
                      columnMeta?.align === "end" && styles.end,
                      isBest && styles.best,
                    )}
                  >
                    {column.render ? column.render(entry.row) : defaultCell(value)}
                  </Cell>
                );
              }}
            </Row>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
