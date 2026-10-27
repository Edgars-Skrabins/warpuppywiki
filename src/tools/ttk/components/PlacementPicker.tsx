import { HIT_PATTERNS, type HitLocation } from "@/core/damage";
import { Select } from "@/ui";
import { MAX_CUSTOM_ZONES, PLACEMENTS, type Placement } from "../state";
import { BodyMap } from "./BodyMap";

const PLACEMENT_OPTIONS: readonly { id: Placement; label: string }[] = PLACEMENTS.map((id) => ({
  id,
  label: id === "custom" ? "Custom" : (HIT_PATTERNS.find((pattern) => pattern.id === id)?.label ?? id),
}));

export interface PlacementPickerProps {
  placement: Placement;
  custom: readonly HitLocation[];
  covered: ReadonlySet<HitLocation>;
  onPlacementChange: (placement: Placement) => void;
  onCustomChange: (custom: HitLocation[]) => void;
}

export function PlacementPicker({
  placement,
  custom,
  covered,
  onPlacementChange,
  onCustomChange,
}: PlacementPickerProps) {
  return (
    <>
      <Select
        label="Shot placement"
        items={PLACEMENT_OPTIONS}
        getKey={(option) => option.id}
        getLabel={(option) => option.label}
        selectedKey={placement}
        onSelectionChange={(_, option) => {
          if (option !== null) onPlacementChange(option.id);
        }}
      />
      {placement === "custom" && (
        <BodyMap sequence={custom} covered={covered} maxZones={MAX_CUSTOM_ZONES} onChange={onCustomChange} />
      )}
    </>
  );
}
