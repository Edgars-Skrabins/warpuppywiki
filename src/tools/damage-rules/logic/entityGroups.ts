import { tagMatches } from "@/core/catalog";

export type EntityGroup = "infantry" | "armor" | "vehicles" | "buildables" | "other";

export const ENTITY_GROUPS: readonly { id: EntityGroup; label: string }[] = [
  { id: "infantry", label: "Infantry" },
  { id: "armor", label: "Armor & helmets" },
  { id: "vehicles", label: "Vehicles" },
  { id: "buildables", label: "Buildables" },
  { id: "other", label: "Other" },
];

export function entityGroup(entity: string): EntityGroup {
  if (tagMatches(entity, "Infantry")) return "infantry";
  if (tagMatches(entity, "Armor") || tagMatches(entity, "Helmet")) return "armor";
  if (tagMatches(entity, "Vehicle.SupplyCrate")) return "other";
  if (tagMatches(entity, "Vehicle")) return "vehicles";
  if (tagMatches(entity, "Buildable")) return "buildables";
  return "other";
}
