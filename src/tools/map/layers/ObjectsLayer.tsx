import { divIcon } from "leaflet";
import { memo, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Marker, Popup, Tooltip, useMap } from "react-leaflet";
import type { MapFile, MapObject } from "@/core/data";
import { Icon, type IconName } from "@/ui";
import { classNames } from "../components/classNames";
import { ObjectPopup } from "../components/ObjectPopup";
import { worldToLatLng } from "../leaflet/projection";
import { factionKey, factionLabel, OBJECT_KIND_LABELS, type FactionKey } from "../logic/objectGroups";
import { OBJECT_ICONS } from "./layerDefinitions";
import styles from "./ObjectsLayer.module.css";

const ICON_SIZE = 24;
const VOLUME_SIZE = 12;
const POPUP_MAX_HEIGHT = 360;

interface ObjectMarkerProps {
  map: MapFile;
  object: MapObject;
}

function markerIcon(content: HTMLElement, faction: FactionKey, icon: IconName | undefined) {
  const size = icon === undefined ? VOLUME_SIZE : ICON_SIZE;
  return divIcon({
    className: classNames(icon === undefined ? styles.volume : styles.marker, styles[faction]),
    html: content,
    iconSize: [size, size],
    tooltipAnchor: [0, -size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function ObjectMarker({ map, object }: ObjectMarkerProps) {
  const leafletMap = useMap();
  const [content] = useState(() => document.createElement("span"));
  const faction = factionKey(object.faction);
  const iconName = OBJECT_ICONS[object.kind];
  const icon = useMemo(() => markerIcon(content, faction, iconName), [content, faction, iconName]);
  const [x, y] = object.position;
  const position = useMemo(
    () => (Number.isFinite(x) && Number.isFinite(y) ? worldToLatLng(map, x, y, leafletMap) : null),
    [map, x, y, leafletMap],
  );
  if (position === null) {
    return null;
  }
  const kind = OBJECT_KIND_LABELS[object.kind];
  const label = object.faction ? `${kind} · ${factionLabel(object.faction)}` : kind;

  return (
    <Marker position={position} icon={icon}>
      {createPortal(
        <>
          {iconName !== undefined && <Icon name={iconName} size={14} />}
          <span className={styles.srOnly}>{label}</span>
        </>,
        content,
      )}
      <Tooltip direction="top">{label}</Tooltip>
      <Popup maxHeight={POPUP_MAX_HEIGHT}>
        <ObjectPopup object={object} />
      </Popup>
    </Marker>
  );
}

export const ObjectsLayer = memo(function ObjectsLayer({
  map,
  objects,
}: {
  map: MapFile;
  objects: readonly MapObject[];
}) {
  return (
    <>
      {objects.map((object) => (
        <ObjectMarker key={object.id} map={map} object={object} />
      ))}
    </>
  );
});
