import { tagMatches, type Catalog, type UnlockInfo } from "@/core/catalog";
import type { Vehicle } from "@/core/data";

export type VehicleType = "air" | "tracked" | "wheeled";

export const VEHICLE_TYPES: readonly VehicleType[] = ["air", "tracked", "wheeled"];

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  air: "Air",
  tracked: "Tracked",
  wheeled: "Wheeled",
};

const TYPE_TAGS: readonly [string, VehicleType][] = [
  ["Vehicle.Variant.Air", "air"],
  ["Vehicle.Variant.Land.Tracked", "tracked"],
  ["Vehicle.Variant.Land.Wheeled", "wheeled"],
];

export type VehicleCatalog = Pick<Catalog, "item" | "price" | "unlock">;

export interface VehicleRow {
  id: string;
  name: string;
  icon: string | null;
  type: VehicleType | null;
  price: number | null;
  unlock: UnlockInfo | null;
  topSpeed: number;
  fuel: number;
  range: number | null;
  seats: number;
  health: number | null;
  criticalThreshold: number | null;
  weapons: readonly string[];
  counterMeasures: readonly string[];
  mass: number | null;
  vehicle: Vehicle;
}

export function vehicleType(id: string): VehicleType | null {
  const match = TYPE_TAGS.find(([tag]) => tagMatches(id, tag) && id.length > tag.length);
  return match ? match[1] : null;
}

export function vehicleRange(vehicle: Vehicle): number | null {
  return vehicle.kmPerLiter === null || vehicle.kmPerLiter === undefined ? null : vehicle.maxFuel * vehicle.kmPerLiter;
}

export function vehicleRow(vehicle: Vehicle, catalog: VehicleCatalog): VehicleRow {
  const item = catalog.item(vehicle.id);
  const type = vehicleType(vehicle.id);
  return {
    id: vehicle.id,
    name: vehicle.name ?? item?.name ?? vehicle.id,
    icon: item?.icon ?? null,
    type,
    price: catalog.price(vehicle.id)?.price ?? null,
    unlock: item ? catalog.unlock(item) : null,
    topSpeed: vehicle.maxSpeed,
    fuel: vehicle.maxFuel,
    range: vehicleRange(vehicle),
    seats: vehicle.seats,
    health: vehicle.health?.initial ?? null,
    criticalThreshold: vehicle.health?.criticalThreshold ?? null,
    weapons: vehicle.weapons ?? [],
    counterMeasures: vehicle.counterMeasures ?? [],
    mass: type === "tracked" ? null : (vehicle.mass ?? null),
    vehicle,
  };
}

export function vehicleRows(vehicles: readonly Vehicle[], catalog: VehicleCatalog): VehicleRow[] {
  return vehicles.map((vehicle) => vehicleRow(vehicle, catalog));
}

export function filterByTypes(rows: readonly VehicleRow[], types: readonly VehicleType[]): VehicleRow[] {
  return types.length === 0 ? [...rows] : rows.filter((row) => row.type !== null && types.includes(row.type));
}
