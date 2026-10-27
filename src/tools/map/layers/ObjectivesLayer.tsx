import { divIcon, type DivIcon } from "leaflet";
import { memo, useMemo } from "react";
import { Circle, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import type { MapFile, ObjectiveConfig } from "@/core/data";
import { classNames } from "../components/classNames";
import { ZonePopup } from "../components/ZonePopup";
import { metersToLatLngDistance, worldToLatLng } from "../leaflet/projection";
import { chanceLabel, placementName, zonePlacements, type ZonePlacement } from "../logic/zoneChances";
import styles from "./ObjectivesLayer.module.css";

export type ZoneVariant = "standard" | "sniperShowdown";

export interface ObjectivesLayerProps {
  map: MapFile;
  config: ObjectiveConfig;
  variant: ZoneVariant;
  title: string;
}

function positiveOrNull(value: number | undefined): number | null {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : null;
}

function labelIcon(text: string, variant: ZoneVariant, never: boolean): DivIcon {
  const span = document.createElement("span");
  span.className = classNames(styles.labelText, styles[`${variant}Label`], never && styles.neverLabel);
  span.textContent = text;
  return divIcon({ className: styles.label, html: span, iconSize: [0, 0] });
}

interface ZoneProps {
  map: MapFile;
  config: ObjectiveConfig;
  placement: ZonePlacement;
  variant: ZoneVariant;
  title: string;
}

function Zone({ map, config, placement, variant, title }: ZoneProps) {
  const leafletMap = useMap();
  const [x, y] = placement.zone.center;
  const label = chanceLabel(placement);
  const icon = useMemo(() => labelIcon(label, variant, placement.never), [label, variant, placement.never]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }
  const center = worldToLatLng(map, x, y, leafletMap);
  const radius = positiveOrNull(placement.zone.extents[0]);
  const hotRadius = positiveOrNull(placement.zone.hotZone.extents[0]);
  const name = `${title}: ${placementName(placement.id)}`;
  const zoneClass = classNames(
    styles.zone,
    styles[variant],
    placement.never && styles.never,
    placement.isDefault && styles.highlight,
  );

  return (
    <>
      {radius !== null && (
        <Circle
          center={center}
          radius={metersToLatLngDistance(map, radius, leafletMap)}
          pathOptions={{ className: zoneClass }}
        >
          <Tooltip sticky>{`${name} · ${label}`}</Tooltip>
          <Popup>
            <ZonePopup title={title} config={config} placement={placement} />
          </Popup>
        </Circle>
      )}
      {hotRadius !== null && (
        <Circle
          center={center}
          radius={metersToLatLngDistance(map, hotRadius, leafletMap)}
          pathOptions={{ className: classNames(styles.hotZone, styles[variant]), fill: false, interactive: false }}
        />
      )}
      <Marker
        position={radius === null ? center : worldToLatLng(map, x, y - radius, leafletMap)}
        icon={icon}
        interactive={false}
        keyboard={false}
      />
    </>
  );
}

export const ObjectivesLayer = memo(function ObjectivesLayer({ map, config, variant, title }: ObjectivesLayerProps) {
  const placements = useMemo(() => zonePlacements(config), [config]);
  return (
    <>
      {placements.map((placement) => (
        <Zone key={placement.id} map={map} config={config} placement={placement} variant={variant} title={title} />
      ))}
    </>
  );
});
