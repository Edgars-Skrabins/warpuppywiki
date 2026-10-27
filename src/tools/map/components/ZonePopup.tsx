import type { ObjectiveConfig } from "@/core/data";
import { formatDistance, formatNumber, formatSeconds } from "@/ui";
import { chanceLabel, placementName, type ZonePlacement } from "../logic/zoneChances";
import { PopupDetails } from "./PopupDetails";

export interface ZonePopupProps {
  title: string;
  config: ObjectiveConfig;
  placement: ZonePlacement;
}

export function ZonePopup({ title, config, placement }: ZonePopupProps) {
  const movement = config.hotZoneMovement;
  const speeds = movement.speeds.filter(Number.isFinite);
  return (
    <PopupDetails
      title={title}
      subtitle={placement.id}
      rows={[
        { label: "Placement", value: placementName(placement.id) },
        { label: "Chance", value: chanceLabel(placement) },
        { label: "Radius", value: formatDistance(placement.zone.extents[0]) },
        { label: "Hot zone radius", value: formatDistance(placement.zone.hotZone.extents[0]) },
        { label: "Half-height", value: formatDistance(placement.zone.extents[2]) },
        { label: "First move delay", value: formatSeconds(movement.firstMoveDelay) },
        { label: "Move delay", value: formatSeconds(movement.moveDelay) },
        {
          label: "Speeds",
          value: speeds.length === 0 ? "—" : speeds.map((speed) => formatNumber(speed)).join(", "),
        },
        { label: "Min move distance", value: formatDistance(movement.minMoveDistance) },
        { label: "Config", value: config.config },
      ]}
    />
  );
}
