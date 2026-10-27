import type { Building } from "@/core/data";
import { formatDistance, formatNumber } from "@/ui";
import { BUILDING_STYLES, buildingSize } from "../logic/buildingStyle";
import { PopupDetails } from "./PopupDetails";

function meters(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : `${formatNumber(value, { maxFractionDigits: 1 })} m`;
}

export function BuildingPopup({ building }: { building: Building }) {
  const size = buildingSize(building);
  return (
    <PopupDetails
      title={BUILDING_STYLES[building.kind].label}
      rows={[
        {
          label: "Footprint",
          value: size === null ? "—" : `${formatDistance(size.width)} × ${formatDistance(size.depth)}`,
        },
        { label: "Height", value: formatDistance(size?.height) },
        { label: "Ground height", value: meters(size?.ground) },
        { label: "Blueprint", value: building.class },
      ]}
    />
  );
}
