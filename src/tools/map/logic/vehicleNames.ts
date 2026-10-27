import type { TagsFile, VehiclesFile } from "@/core/data";
import { IdMap } from "@/core/catalog";

export type VehicleNamer = (id: string) => string;

const DEFAULT_VARIANT = "Default";

export function vehicleNamer(
  vehicles: VehiclesFile | null | undefined,
  tags: TagsFile | null | undefined,
): VehicleNamer {
  const names = new IdMap<string>();
  for (const vehicle of vehicles?.vehicles ?? []) {
    if (vehicle.name !== null && vehicle.name !== undefined && vehicle.name.trim() !== "") {
      names.set(vehicle.id, vehicle.name);
    }
  }
  const tagTexts = new IdMap<string>();
  for (const entry of tags?.tags ?? []) {
    tagTexts.set(entry.tag, entry.text);
  }
  return (id) => names.get(id) ?? names.get(`${id}.${DEFAULT_VARIANT}`) ?? tagTexts.get(id) ?? id;
}
