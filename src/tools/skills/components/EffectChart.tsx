import { LineChartCard } from "@/ui";
import type { EffectRow } from "../logic/skillEffects";
import { formatEffectValue } from "./effectFormat";

export const MIN_CHART_LEVELS = 3;

export interface EffectChartProps {
  effect: EffectRow;
  width?: number;
}

export function EffectChart({ effect, width }: EffectChartProps) {
  if (effect.levels.length < MIN_CHART_LEVELS) {
    return null;
  }
  return (
    <LineChartCard
      title={`${effect.label} by level`}
      series={[
        {
          key: effect.key,
          label: effect.label,
          points: effect.levels.map((entry) => ({ x: entry.level, y: entry.value })),
        },
      ]}
      xLabel="Level"
      yLabel={effect.label}
      formatX={(value) => String(value)}
      formatY={(value) => formatEffectValue(value, effect.unit)}
      height={200}
      width={width}
    />
  );
}
