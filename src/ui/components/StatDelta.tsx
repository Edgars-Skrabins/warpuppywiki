import { VisuallyHidden } from "react-aria-components";
import { formatDelta, type DeltaDirection, type DeltaFormat } from "../format";
import { classNames } from "./classNames";
import styles from "./StatDelta.module.css";

export type BetterWhen = "higher" | "lower" | "neutral";

export type DeltaQuality = "better" | "worse" | "neutral";

export interface StatDeltaProps {
  from: number | null | undefined;
  to: number | null | undefined;
  betterWhen: BetterWhen;
  format: DeltaFormat;
  className?: string;
}

function deltaQuality(direction: DeltaDirection, betterWhen: BetterWhen): DeltaQuality {
  if (direction === "none" || betterWhen === "neutral") return "neutral";
  return (direction === "up") === (betterWhen === "higher") ? "better" : "worse";
}

const arrows: Record<DeltaDirection, string> = { up: "▲", down: "▼", none: "" };

export function StatDelta({ from, to, betterWhen, format, className }: StatDeltaProps) {
  const { text, direction } = formatDelta(from, to, format);
  const quality = deltaQuality(direction, betterWhen);
  return (
    <span className={classNames(styles.delta, styles[quality], className)} data-quality={quality}>
      {direction !== "none" && (
        <span className={styles.arrow} aria-hidden="true">
          {arrows[direction]}
        </span>
      )}
      <span>{text}</span>
      {quality !== "neutral" && <VisuallyHidden>{`(${quality})`}</VisuallyHidden>}
    </span>
  );
}
