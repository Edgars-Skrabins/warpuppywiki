export const SERIES_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
] as const;

export const MAX_SERIES = SERIES_COLORS.length;

export const OVERFLOW_SERIES_COLOR = "var(--color-text-muted)";

export function seriesColor(index: number): string {
  return SERIES_COLORS[index] ?? OVERFLOW_SERIES_COLOR;
}

export const chartTheme = {
  surface: "var(--color-surface)",
  grid: "var(--chart-grid)",
  axisLine: "var(--color-border-strong)",
  axisText: "var(--chart-axis)",
  reference: "var(--color-text-muted)",
  cursor: "var(--color-border-strong)",
  fontSize: 12,
  lineWidth: 2,
  dotRadius: 4,
  ringWidth: 2,
  barSize: 24,
  barRadius: 2,
} as const;

export const axisProps = {
  stroke: chartTheme.axisLine,
  tick: { fill: chartTheme.axisText, fontSize: chartTheme.fontSize },
  tickLine: false,
  tickMargin: 6,
} as const;

export const gridProps = {
  stroke: chartTheme.grid,
  strokeWidth: 1,
} as const;

export const axisLabelStyle = {
  fill: chartTheme.axisText,
  fontSize: chartTheme.fontSize,
} as const;
