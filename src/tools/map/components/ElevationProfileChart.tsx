import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceDot, Tooltip, XAxis, YAxis } from "recharts";
import { axisLabelStyle, axisProps, chartTheme, formatDistance, formatNumber, gridProps } from "@/ui";
import type { LosResult } from "../los/losModel";
import styles from "./ElevationProfileChart.module.css";

export interface ElevationProfileChartProps {
  result: LosResult;
  onHover: (distance: number | null) => void;
}

const HEIGHT = 240;

function meters(value: number): string {
  return `${formatNumber(Math.round(value))} m`;
}

export function ElevationProfileChart({ result, onHover }: ElevationProfileChartProps) {
  const { profile, obstruction, buildings } = result;
  const sightColor = result.clear ? "var(--color-success)" : "var(--color-danger)";

  return (
    <figure className={styles.figure} aria-label="Elevation profile">
      <ComposedChart
        responsive
        style={{ width: "100%", height: HEIGHT }}
        data={profile}
        margin={{ top: 8, right: 16, bottom: 20, left: 8 }}
        onMouseMove={(state) => {
          const index = Number(state.activeTooltipIndex);
          onHover(Number.isInteger(index) ? (profile[index]?.distance ?? null) : null);
        }}
        onMouseLeave={() => onHover(null)}
      >
        <CartesianGrid {...gridProps} vertical={false} />
        <XAxis
          {...axisProps}
          dataKey="distance"
          type="number"
          domain={[0, "dataMax"]}
          tickFormatter={(value: number) => formatDistance(value)}
          label={{ ...axisLabelStyle, value: "Distance", position: "insideBottom", offset: -12 }}
        />
        <YAxis
          {...axisProps}
          domain={["auto", "auto"]}
          tickFormatter={(value: number) => formatNumber(Math.round(value))}
          width={56}
          label={{
            ...axisLabelStyle,
            value: "Height (m)",
            angle: -90,
            position: "insideLeft",
            style: { textAnchor: "middle" },
          }}
        />
        {buildings.map((building) => (
          <ReferenceArea
            key={building.id}
            x1={building.from}
            x2={Math.max(building.to, building.from + 1)}
            y2={building.top}
            fill="var(--color-text-muted)"
            fillOpacity={0.35}
            stroke="none"
            ifOverflow="extendDomain"
          />
        ))}
        <Area
          dataKey="ground"
          name="Ground"
          type="linear"
          stroke="var(--color-text-muted)"
          fill="var(--color-text-muted)"
          fillOpacity={0.2}
          strokeWidth={1.5}
          isAnimationActive={false}
          connectNulls={false}
          baseValue="dataMin"
        />
        <Line
          dataKey="sight"
          name={result.path.length > 2 ? "Arc" : "Sight line"}
          type="linear"
          stroke={sightColor}
          strokeWidth={chartTheme.lineWidth}
          dot={false}
          isAnimationActive={false}
        />
        {obstruction !== null && (
          <ReferenceDot
            x={obstruction.distance}
            y={obstruction.point[2]}
            r={5}
            fill="var(--color-danger)"
            stroke="var(--color-bg)"
            ifOverflow="extendDomain"
          />
        )}
        <Tooltip
          cursor={{ stroke: chartTheme.cursor, strokeWidth: 1 }}
          isAnimationActive={false}
          content={({ active, payload, label }) =>
            active && payload && payload.length > 0 ? (
              <div className={styles.tooltip}>
                <div className={styles.tooltipTitle}>{formatDistance(Number(label))}</div>
                {payload.map((entry) => (
                  <div key={String(entry.dataKey)} className={styles.tooltipRow}>
                    <span>{entry.name}</span>
                    <span>{typeof entry.value === "number" ? meters(entry.value) : "—"}</span>
                  </div>
                ))}
              </div>
            ) : null
          }
        />
      </ComposedChart>
    </figure>
  );
}
