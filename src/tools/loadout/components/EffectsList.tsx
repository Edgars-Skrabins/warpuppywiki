import { formatDistance, formatNumber } from "@/ui";
import type { EffectRow } from "../model/totals";
import { SheetRow, SheetRows, type SheetTone } from "./Sheet";

function effectText(effect: EffectRow): string {
  const { value } = effect.result;
  if (effect.info.unit === "points") {
    return `${value > 0 ? "+" : ""}${formatNumber(value)}`;
  }
  if (effect.info.unit === "meters") {
    return formatDistance(value);
  }
  return `×${formatNumber(value, { maxFractionDigits: 3 })}`;
}

function effectTone(effect: EffectRow): SheetTone {
  const neutralValue = effect.info.unit === "multiplier" ? 1 : 0;
  const { value } = effect.result;
  if (effect.info.betterWhen === "neutral" || value === neutralValue) {
    return "muted";
  }
  const higher = value > neutralValue;
  return higher === (effect.info.betterWhen === "higher") ? "better" : "worse";
}

export interface EffectsListProps {
  effects: readonly EffectRow[];
  label: string;
}

export function EffectsList({ effects, label }: EffectsListProps) {
  return (
    <SheetRows label={label}>
      {effects.map((effect) => (
        <SheetRow
          key={effect.attribute}
          label={effect.info.label}
          value={effectText(effect)}
          tone={effectTone(effect)}
        />
      ))}
    </SheetRows>
  );
}
