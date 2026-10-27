import { seriesColor } from "@/ui";
import { cumulativeRecoil, type RecoilPoint } from "../diff/recoilPath";
import styles from "./RecoilChangePlot.module.css";

export interface RecoilChangePlotProps {
  before: unknown;
  after: unknown;
}

const SIZE = 240;
const PADDING = 12;

function bounds(paths: readonly RecoilPoint[][]) {
  const points = paths.flat();
  const xs = points.map((point) => Math.abs(point.x));
  const ys = points.map((point) => point.y);
  const halfWidth = Math.max(...xs, 0.001);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 0.001);
  const span = Math.max(halfWidth * 2, maxY - minY);
  return { span, minY };
}

function polyline(path: readonly RecoilPoint[], span: number, minY: number): string {
  const scale = (SIZE - PADDING * 2) / span;
  return path.map((point) => `${SIZE / 2 + point.x * scale},${SIZE - PADDING - (point.y - minY) * scale}`).join(" ");
}

export function RecoilChangePlot({ before, after }: RecoilChangePlotProps) {
  const series = [
    { label: "Before", path: cumulativeRecoil(before), color: seriesColor(0) },
    { label: "After", path: cumulativeRecoil(after), color: seriesColor(1) },
  ];
  const drawn = series.filter((entry) => entry.path.length > 0);
  if (drawn.length === 0) {
    return null;
  }
  const { span, minY } = bounds(drawn.map((entry) => entry.path));
  return (
    <figure className={styles.figure}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={styles.plot}
        role="img"
        aria-label="Cumulative recoil before and after"
      >
        <line x1={SIZE / 2} y1={PADDING} x2={SIZE / 2} y2={SIZE - PADDING} className={styles.axis} />
        {drawn.map((entry) => (
          <polyline
            key={entry.label}
            points={polyline(entry.path, span, minY)}
            fill="none"
            stroke={entry.color}
            strokeWidth={2}
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <figcaption className={styles.legend}>
        <span className={styles.title}>Recoil pattern</span>
        {series.map((entry) => (
          <span key={entry.label} className={styles.item}>
            <span className={styles.swatch} style={{ background: entry.color }} />
            {entry.label}
            {entry.path.length === 0 && " (none)"}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
