import { formatNumber, LineChartCard } from "@/ui";
import { inputLabel, isDistanceInput, toGameUnits } from "../model/contextTags";
import { curvePoints } from "../model/curves";
import type { CurveUse } from "../model/resolveNames";

const HEADROOM = 1.2;

export function CurveChart({ use, value }: { use: CurveUse; value: number }) {
  const scale = toGameUnits(use.input, 1);
  const lastInput = Math.max(...use.curve.points.map((point) => point.input), 0);
  const until = Math.max(lastInput * HEADROOM, use.gameInput);
  const points = curvePoints(use.curve, until).map((point) => ({ x: point.input / scale, y: point.value }));
  const unit = isDistanceInput(use.input) ? " m" : "";

  return (
    <LineChartCard
      title={use.curve.id.split(".").slice(-2).join(".")}
      subtitle={`${formatNumber(use.inputValue)}${unit} → ${formatNumber(value, { maxFractionDigits: 4 })}`}
      series={[{ key: "curve", label: use.curve.id, points }]}
      xLabel={inputLabel(use.input)}
      yLabel="Value"
      formatX={(x) => `${formatNumber(x)}${unit}`}
      referenceLines={[
        { axis: "x", value: use.inputValue, label: `${formatNumber(use.inputValue)}${unit}` },
        { axis: "y", value, label: formatNumber(value, { maxFractionDigits: 4 }) },
      ]}
      height={200}
    />
  );
}
