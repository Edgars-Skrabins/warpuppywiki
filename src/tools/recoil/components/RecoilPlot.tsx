import { useId } from "react";
import { formatNumber, SegmentedControl, Stack, Switch } from "@/ui";
import { gridTicks, type Bounds, type RecoilPath, type Vector } from "../logic/recoilPath";
import type { RecoilView } from "../state";
import styles from "./RecoilPlot.module.css";

export interface PlotSeries {
  key: string;
  label: string;
  color: string;
  path: RecoilPath;
  shown: number;
}

export interface RecoilPlotProps {
  series: readonly PlotSeries[];
  frame: Bounds;
  view: RecoilView;
  onViewChange: (view: RecoilView) => void;
  lockScale: boolean;
  onLockScaleChange: (locked: boolean) => void;
  lockDisabled: boolean;
}

const VIEW_OPTIONS = [
  { id: "aim", label: "Aim path" },
  { id: "guide", label: "Pull-down guide" },
] as const;

const AXIS_LABELS: Record<RecoilView, { x: string; y: string }> = {
  aim: { x: "Horizontal kick (game units)", y: "Vertical kick (game units)" },
  guide: { x: "Horizontal pull (game units)", y: "Vertical pull (game units)" },
};

const INNER = 440;
const LEFT = 52;
const RIGHT = 12;
const TOP = 12;
const BOTTOM = 44;
const WIDTH = LEFT + INNER + RIGHT;
const HEIGHT = TOP + INNER + BOTTOM;
const LABEL_EVERY = 5;
const DOT_RADIUS = 2.5;

function scaler(frame: Bounds) {
  const toX = (x: number) => LEFT + ((x - frame.minX) / (frame.maxX - frame.minX)) * INNER;
  const toY = (y: number) => TOP + ((frame.maxY - y) / (frame.maxY - frame.minY)) * INNER;
  const point = (vector: Vector) => `${toX(vector.x)},${toY(vector.y)}`;
  return { toX, toY, point };
}

export function RecoilPlot({
  series,
  frame,
  view,
  onViewChange,
  lockScale,
  onLockScaleChange,
  lockDisabled,
}: RecoilPlotProps) {
  const clipId = useId();
  const { toX, toY, point } = scaler(frame);
  const xTicks = gridTicks(frame.minX, frame.maxX);
  const yTicks = gridTicks(frame.minY, frame.maxY);
  const labels = AXIS_LABELS[view];

  return (
    <div className={styles.plot}>
      <Stack direction="horizontal" gap={3} align="center" justify="space-between" wrap>
        <SegmentedControl aria-label="View" size="sm" options={VIEW_OPTIONS} value={view} onChange={onViewChange} />
        <Switch isSelected={lockScale || lockDisabled} isDisabled={lockDisabled} onChange={onLockScaleChange}>
          Lock scale
        </Switch>
      </Stack>
      {series.length > 1 && (
        <ul className={styles.legend} aria-label="Legend">
          {series.map((entry) => (
            <li key={entry.key} className={styles.legendItem}>
              <span className={styles.swatch} style={{ background: entry.color }} />
              {entry.label}
            </li>
          ))}
        </ul>
      )}
      <svg
        className={styles.svg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Recoil ${view === "aim" ? "aim path" : "pull-down guide"} of ${series.map((entry) => entry.label).join(" and ")}`}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={LEFT} y={TOP} width={INNER} height={INNER} />
          </clipPath>
        </defs>
        <g className={styles.grid}>
          {xTicks.map((tick) => (
            <line key={`x${tick}`} x1={toX(tick)} x2={toX(tick)} y1={TOP} y2={TOP + INNER} />
          ))}
          {yTicks.map((tick) => (
            <line key={`y${tick}`} x1={LEFT} x2={LEFT + INNER} y1={toY(tick)} y2={toY(tick)} />
          ))}
        </g>
        <rect className={styles.frame} x={LEFT} y={TOP} width={INNER} height={INNER} />
        <g className={styles.axes} clipPath={`url(#${clipId})`}>
          <line x1={toX(0)} x2={toX(0)} y1={TOP} y2={TOP + INNER} />
          <line x1={LEFT} x2={LEFT + INNER} y1={toY(0)} y2={toY(0)} />
        </g>
        <g className={styles.ticks}>
          {xTicks.map((tick) => (
            <text key={`x${tick}`} x={toX(tick)} y={TOP + INNER + 16} textAnchor="middle">
              {formatNumber(tick)}
            </text>
          ))}
          {yTicks.map((tick) => (
            <text key={`y${tick}`} x={LEFT - 8} y={toY(tick)} textAnchor="end" dominantBaseline="middle">
              {formatNumber(tick)}
            </text>
          ))}
        </g>
        <text className={styles.axisTitle} x={LEFT + INNER / 2} y={HEIGHT - 6} textAnchor="middle">
          {labels.x}
        </text>
        <text
          className={styles.axisTitle}
          transform={`translate(14 ${TOP + INNER / 2}) rotate(-90)`}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {labels.y}
        </text>
        <g clipPath={`url(#${clipId})`}>
          {series.map((entry) => {
            const visible = entry.path.points.slice(0, entry.shown);
            const cone = entry.shown >= entry.path.points.length ? entry.path.cone : null;
            const start = entry.path.points[entry.path.points.length - 1];
            return (
              <g key={entry.key} data-testid="recoil-series" aria-label={entry.label}>
                {cone !== null && start !== undefined && (
                  <g data-testid="recoil-cone">
                    <polygon
                      className={styles.cone}
                      points={[...cone.lower, ...[...cone.upper].reverse()].map(point).join(" ")}
                      fill={entry.color}
                    />
                    <polyline
                      className={styles.coneEdge}
                      points={cone.lower.map(point).join(" ")}
                      stroke={entry.color}
                    />
                    <polyline
                      className={styles.coneEdge}
                      points={cone.upper.map(point).join(" ")}
                      stroke={entry.color}
                    />
                    <text className={styles.coneLabel} x={toX(start.x) + 8} y={toY(start.y)} dominantBaseline="middle">
                      Random after shot {entry.path.points.length}
                    </text>
                  </g>
                )}
                <polyline
                  className={styles.path}
                  data-testid="recoil-path"
                  points={[{ x: 0, y: 0 }, ...visible].map(point).join(" ")}
                  stroke={entry.color}
                />
                {visible.map((shot) => (
                  <circle key={shot.shot} cx={toX(shot.x)} cy={toY(shot.y)} r={DOT_RADIUS} fill={entry.color} />
                ))}
                {visible
                  .filter((shot) => shot.shot % LABEL_EVERY === 0)
                  .map((shot) => (
                    <text key={shot.shot} className={styles.shotLabel} x={toX(shot.x) + 6} y={toY(shot.y) - 6}>
                      {shot.shot}
                    </text>
                  ))}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
