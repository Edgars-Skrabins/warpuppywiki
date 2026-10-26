import { useMemo, type ReactNode } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import { formatNumber } from "../../format";
import { ChartCard } from "./ChartCard";
import { ChartTooltip } from "./ChartTooltip";
import { axisLabelStyle, axisProps, chartTheme, gridProps, seriesColor } from "./chartTheme";

export interface LinePoint {
  x: number;
  y: number | null;
}

export interface LineSeries {
  key: string;
  label: string;
  points: readonly LinePoint[];
  color?: string;
}

export interface ReferenceLineSpec {
  axis: "x" | "y";
  value: number;
  label?: string;
}

export interface LineChartCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  series: readonly LineSeries[];
  xLabel: string;
  yLabel: string;
  formatX?: (value: number) => string;
  formatY?: (value: number) => string;
  referenceLines?: readonly ReferenceLineSpec[];
  xDomain?: [number | "auto" | "dataMin", number | "auto" | "dataMax"];
  yDomain?: [number | "auto" | "dataMin", number | "auto" | "dataMax"];
  height?: number;
  width?: number;
  className?: string;
}

type Row = { x: number } & Record<string, number | null>;

function mergeSeries(series: readonly LineSeries[]): Row[] {
  const rows = new Map<number, Row>();
  series.forEach((line, index) => {
    for (const point of line.points) {
      let row = rows.get(point.x);
      if (!row) {
        row = { x: point.x };
        rows.set(point.x, row);
      }
      row[`s${index}`] = point.y;
    }
  });
  return [...rows.values()].sort((a, b) => a.x - b.x);
}

const defaultFormat = (value: number) => formatNumber(value);

export function LineChartCard({
  title,
  subtitle,
  actions,
  series,
  xLabel,
  yLabel,
  formatX = defaultFormat,
  formatY = defaultFormat,
  referenceLines = [],
  xDomain = ["dataMin", "dataMax"],
  yDomain = ["auto", "auto"],
  height = 280,
  width,
  className,
}: LineChartCardProps) {
  const data = useMemo(() => mergeSeries(series), [series]);
  const colors = series.map((line, index) => line.color ?? seriesColor(index));
  const legend = series.map((line, index) => ({
    key: line.key,
    label: line.label,
    color: colors[index] ?? seriesColor(index),
    kind: "line" as const,
  }));

  const sizeProps = width === undefined ? { responsive: true, style: { width: "100%", height } } : { width, height };

  return (
    <ChartCard title={title} subtitle={subtitle} actions={actions} legend={legend} className={className}>
      <LineChart {...sizeProps} data={data} margin={{ top: 8, right: 16, bottom: 20, left: 8 }} accessibilityLayer>
        <CartesianGrid {...gridProps} vertical={false} />
        <XAxis
          {...axisProps}
          dataKey="x"
          type="number"
          domain={xDomain}
          tickFormatter={formatX}
          label={{ ...axisLabelStyle, value: xLabel, position: "insideBottom", offset: -12 }}
        />
        <YAxis
          {...axisProps}
          domain={yDomain}
          tickFormatter={formatY}
          width={56}
          label={{
            ...axisLabelStyle,
            value: yLabel,
            angle: -90,
            position: "insideLeft",
            style: { textAnchor: "middle" },
          }}
        />
        <Tooltip
          cursor={{ stroke: chartTheme.cursor, strokeWidth: 1 }}
          isAnimationActive={false}
          content={({ active, payload, label }) =>
            active && payload && payload.length > 0 ? (
              <ChartTooltip
                title={`${xLabel}: ${formatX(Number(label))}`}
                rows={payload.map((entry) => {
                  const index = Number(String(entry.dataKey).slice(1));
                  return {
                    key: String(entry.dataKey),
                    label: series[index]?.label ?? "",
                    color: colors[index] ?? seriesColor(index),
                    value: typeof entry.value === "number" ? formatY(entry.value) : "—",
                  };
                })}
              />
            ) : null
          }
        />
        {referenceLines.map((line) => (
          <ReferenceLine
            key={`${line.axis}-${line.value}`}
            {...(line.axis === "x" ? { x: line.value } : { y: line.value })}
            stroke={chartTheme.reference}
            strokeDasharray="4 4"
            label={
              line.label
                ? {
                    value: line.label,
                    position: line.axis === "x" ? "insideTopRight" : "insideTopLeft",
                    ...axisLabelStyle,
                  }
                : undefined
            }
          />
        ))}
        {series.map((line, index) => (
          <Line
            key={line.key}
            dataKey={`s${index}`}
            name={line.label}
            type="linear"
            stroke={colors[index]}
            strokeWidth={chartTheme.lineWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={false}
            activeDot={{
              r: chartTheme.dotRadius,
              fill: colors[index],
              stroke: chartTheme.surface,
              strokeWidth: chartTheme.ringWidth,
            }}
            connectNulls
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ChartCard>
  );
}
