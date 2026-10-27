import { IdMap, stripPrefix } from "@/core/catalog";
import type { Vehicle, VehicleSeatDamage } from "@/core/data";

export const ARMS_CLASSES = ["Small", "Medium", "High", "Special"] as const;

export type ArmsClass = (typeof ARMS_CLASSES)[number];

export interface VehicleSeatRow {
  vehicle: string;
  name: string;
  reductions: Record<ArmsClass, number | null>;
}

const VARIANT_PREFIX = "Vehicle.Variant";

export function vehicleSeatRows(seats: readonly VehicleSeatDamage[], vehicles: readonly Vehicle[]): VehicleSeatRow[] {
  const names = new IdMap<string>();
  for (const vehicle of vehicles) {
    if (vehicle.name) names.set(vehicle.id, vehicle.name);
  }
  return seats.map((seat) => {
    const reductions = Object.fromEntries(
      ARMS_CLASSES.map((armsClass) => [
        armsClass,
        seat.rules.find((rule) => rule.damageSources.includes(armsClass))?.reduction ?? null,
      ]),
    ) as Record<ArmsClass, number | null>;
    return {
      vehicle: seat.vehicle,
      name: names.get(seat.vehicle) ?? stripPrefix(seat.vehicle, VARIANT_PREFIX),
      reductions,
    };
  });
}
