import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { formatNumber } from "../../format";
import { ChartCard } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";
import { axisLabelStyle, axisProps, chartTheme, gridProps, seriesColor } from "./chartTheme";
import type { ReferenceLineSpec } from "./LineChartCard";

export interface BarSeries<T> {
  key: string;
  label: string;
  value: (row: T) => number | null;
  color?: string;
}

export interface BarChartCardProps<T> {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  data: readonly T[];
  getCategory: (row: T) => string;
  series: readonly BarSeries<T>[];
  orientation?: "vertical" | "horizontal";
  valueLabel?: string;
  categoryLabel?: string;
  formatValue?: (value: number) => string;
  getBarColor?: (row: T, seriesKey: string) => string | undefined;
  referenceValue?: Omit<ReferenceLineSpec, "axis">;
  height?: number;
  width?: number;
  className?: string;
}

type Row = { category: string } & Record<string, number | null | string>;

const defaultFormat = (value: number) => formatNumber(value);

export function BarChartCard<T>({
  title,
  subtitle,
  actions,
  data,
  getCategory,
  series,
  orientation = "vertical",
  valueLabel,
  categoryLabel,
  formatValue = defaultFormat,
  getBarColor,
  referenceValue,
  height,
  width,
  className,
}: BarChartCardProps<T>) {
  const horizontal = orientation === "horizontal";
  const colors = series.map((bar, index) => bar.color ?? seriesColor(index));
  const legend = series.map((bar, index) => ({
    key: bar.key,
    label: bar.label,
    color: colors[index] ?? seriesColor(index),
    kind: "bar" as const,
  }));
  const rows: Row[] = data.map((row) => {
    const entry: Row = { category: getCategory(row) };
    series.forEach((bar, index) => {
      entry[`s${index}`] = bar.value(row);
    });
    return entry;
  });

  const resolvedHeight =
    height ?? (horizontal ? Math.max(160, rows.length * 32 * Math.max(1, series.length * 0.75) + 48) : 280);
  const sizeProps =
    width === undefined
      ? { responsive: true, style: { width: "100%", height: resolvedHeight } }
      : { width, height: resolvedHeight };

  const valueAxis = {
    ...axisProps,
    type: "number" as const,
    tickFormatter: formatValue,
  };
  const categoryAxis = {
    ...axisProps,
    type: "category" as const,
    dataKey: "category",
    interval: 0 as const,
  };
  const radius: [number, number, number, number] = horizontal
    ? [0, chartTheme.barRadius, chartTheme.barRadius, 0]
    : [chartTheme.barRadius, chartTheme.barRadius, 0, 0];

  return (
    <ChartCard title={title} subtitle={subtitle} actions={actions} legend={legend} className={className}>
      <BarChart
        {...sizeProps}
        data={rows}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 8, right: 16, bottom: valueLabel || categoryLabel ? 20 : 4, left: 8 }}
        barGap={2}
        barCategoryGap="20%"
        accessibilityLayer
      >
        <CartesianGrid {...gridProps} horizontal={!horizontal} vertical={horizontal} />
        {horizontal ? (
          <>
            <XAxis
              {...valueAxis}
              label={
                valueLabel ? { ...axisLabelStyle, value: valueLabel, position: "insideBottom", offset: -12 } : undefined
              }
            />
            <YAxis {...categoryAxis} width={120} />
          </>
        ) : (
          <>
            <XAxis
              {...categoryAxis}
              label={
                categoryLabel
                  ? { ...axisLabelStyle, value: categoryLabel, position: "insideBottom", offset: -12 }
                  : undefined
              }
            />
            <YAxis
              {...valueAxis}
              width={56}
              label={
                valueLabel
                  ? {
                      ...axisLabelStyle,
                      value: valueLabel,
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle" },
                    }
                  : undefined
              }
            />
          </>
        )}
        <Tooltip
          cursor={{ fill: "var(--color-surface-hover)" }}
          isAnimationActive={false}
          content={({ active, payload, label }) =>
            active && payload && payload.length > 0 ? (
              <ChartTooltip
                title={String(label)}
                rows={payload.map((entry) => {
                  const index = Number(String(entry.dataKey).slice(1));
                  return {
                    key: String(entry.dataKey),
                    label: series[index]?.label ?? "",
                    color: colors[index] ?? seriesColor(index),
                    value: typeof entry.value === "number" ? formatValue(entry.value) : "—",
                  };
                })}
              />
            ) : null
          }
        />
        {referenceValue && (
          <ReferenceLine
            {...(horizontal ? { x: referenceValue.value } : { y: referenceValue.value })}
            stroke={chartTheme.reference}
            strokeDasharray="4 4"
            label={
              referenceValue.label
                ? { value: referenceValue.label, position: "insideTopRight", ...axisLabelStyle }
                : undefined
            }
          />
        )}
        {series.map((bar, index) => (
          <Bar
            key={bar.key}
            dataKey={`s${index}`}
            name={bar.label}
            fill={colors[index]}
            radius={radius}
            maxBarSize={chartTheme.barSize}
            isAnimationActive={false}
          >
            {getBarColor &&
              data.map((row, rowIndex) => <Cell key={rowIndex} fill={getBarColor(row, bar.key) ?? colors[index]} />)}
          </Bar>
        ))}
      </BarChart>
    </ChartCard>
  );
}
