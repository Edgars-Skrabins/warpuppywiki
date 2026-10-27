import { NumberField } from "@/ui";

export interface PelletsFieldProps {
  value: number;
  onChange: (pellets: number) => void;
}

export function PelletsField({ value, onChange }: PelletsFieldProps) {
  return (
    <NumberField
      label="Pellets that hit per shot"
      minValue={1}
      maxValue={20}
      step={1}
      value={value}
      description="Pellet count is not in the game files."
      onChange={(pellets) => {
        if (Number.isFinite(pellets)) onChange(pellets);
      }}
    />
  );
}
