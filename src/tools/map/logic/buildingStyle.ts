import type { Building } from "@/core/data";

export type BuildingKind = Building["kind"];

export const BUILDING_KINDS = [
  "bungalow",
  "house",
  "apartment",
  "warehouse",
  "market",
  "shop",
  "garage",
  "office",
  "supply",
  "pool",
] as const satisfies readonly BuildingKind[];

export interface BuildingStyle {
  label: string;
  color: string;
}

export const BUILDING_STYLES: Record<BuildingKind, BuildingStyle> = {
  bungalow: { label: "Bungalow", color: "--chart-1" },
  house: { label: "House", color: "--chart-5" },
  apartment: { label: "Apartment", color: "--chart-4" },
  warehouse: { label: "Warehouse", color: "--chart-2" },
  market: { label: "Market", color: "--chart-6" },
  shop: { label: "Shop", color: "--color-danger" },
  garage: { label: "Garage", color: "--chart-3" },
  office: { label: "Office", color: "--color-info" },
  supply: { label: "Supply", color: "--color-warning" },
  pool: { label: "Pool", color: "--color-text" },
};

export interface BuildingSize {
  width: number;
  depth: number;
  height: number;
  ground: number;
}

export function buildingCounts(buildings: readonly Building[]): Record<BuildingKind, number> {
  const counts = Object.fromEntries(BUILDING_KINDS.map((kind) => [kind, 0])) as Record<BuildingKind, number>;
  for (const building of buildings) {
    counts[building.kind] += 1;
  }
  return counts;
}

export function buildingSize(building: Building): BuildingSize | null {
  const [minX, minY, minZ] = building.min;
  const [maxX, maxY, maxZ] = building.max;
  const values = [minX, minY, minZ, maxX, maxY, maxZ];
  if (!values.every(Number.isFinite)) {
    return null;
  }
  return {
    width: Math.abs(maxX - minX),
    depth: Math.abs(maxY - minY),
    height: Math.abs(maxZ - minZ),
    ground: Math.min(minZ, maxZ),
  };
}

export function isDrawable(building: Building): boolean {
  const size = buildingSize(building);
  return size !== null && size.width > 0 && size.depth > 0;
}
