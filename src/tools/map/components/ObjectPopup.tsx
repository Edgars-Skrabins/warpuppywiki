import { useMemo } from "react";
import { useGameDataMany, type MapObject } from "@/core/data";
import { formatNumber } from "@/ui";
import { factionLabel, headingDegrees, OBJECT_KIND_LABELS } from "../logic/objectGroups";
import { vehicleNamer, type VehicleNamer } from "../logic/vehicleNames";
import { PopupDetails, type PopupRow } from "./PopupDetails";
import styles from "./PopupDetails.module.css";

const NAME_FILES = ["vehicles", "tags"] as const;

function meters(value: number): string {
  return Number.isFinite(value) ? `${formatNumber(value, { maxFractionDigits: 1 })} m` : "—";
}

function VehicleList({ ids, name }: { ids: readonly string[] | null | undefined; name: VehicleNamer }) {
  if (ids === null || ids === undefined || ids.length === 0) {
    return "—";
  }
  return (
    <ul className={styles.list}>
      {ids.map((id) => (
        <li key={id}>{name(id)}</li>
      ))}
    </ul>
  );
}

function useVehicleNamer(): VehicleNamer {
  const files = useGameDataMany(NAME_FILES);
  const vehicles = files.status === "success" ? files.data.vehicles : undefined;
  const tags = files.status === "success" ? files.data.tags : undefined;
  return useMemo(() => vehicleNamer(vehicles, tags), [vehicles, tags]);
}

export function ObjectPopup({ object }: { object: MapObject }) {
  const name = useVehicleNamer();
  const heading = headingDegrees(object.yaw);
  const [x, y, z] = object.position;
  const rows: PopupRow[] = [
    { label: "Faction", value: factionLabel(object.faction) },
    { label: "X", value: meters(x) },
    { label: "Y", value: meters(y) },
    { label: "Z", value: meters(z) },
    { label: "Heading", value: heading === null ? "—" : `${formatNumber(heading, { maxFractionDigits: 0 })}°` },
  ];
  if (object.kind === "spawn-volume") {
    rows.push(
      { label: "Allowed vehicles", value: <VehicleList ids={object.allowedVehicles} name={name} /> },
      { label: "Disallowed vehicles", value: <VehicleList ids={object.disallowedVehicles} name={name} /> },
    );
  }
  return <PopupDetails title={OBJECT_KIND_LABELS[object.kind]} subtitle={object.class} rows={rows} />;
}
