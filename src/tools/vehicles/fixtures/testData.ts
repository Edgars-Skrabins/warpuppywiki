import { buildCatalog } from "@/core/catalog";
import type { DamageFile, Item, ItemsFile, RolesFile, TagsFile, Vehicle, VehiclesFile } from "@/core/data";

const shared = import.meta.glob<unknown>("/src/test/fixtures/data/25937608/{items,damage,tags,roles}.json", {
  eager: true,
  import: "default",
});
const own = import.meta.glob<unknown>("./*.json", { eager: true, import: "default" });

const sharedItems = shared["/src/test/fixtures/data/25937608/items.json"] as ItemsFile;
const sharedDamage = shared["/src/test/fixtures/data/25937608/damage.json"] as DamageFile;
const sharedTags = shared["/src/test/fixtures/data/25937608/tags.json"] as TagsFile;
const sharedRoles = shared["/src/test/fixtures/data/25937608/roles.json"] as RolesFile;

export const toolItems = own["./items.json"] as Item[];
export const toolDamageRules = own["./damageRules.json"] as DamageFile["rules"];
export const toolVehicleSeats = own["./vehicleSeats.json"] as DamageFile["vehicleSeats"];
export const vehiclesFile = own["./vehicles.json"] as VehiclesFile;

export const fixtureItems: Item[] = [...sharedItems.items, ...toolItems];

export const fixtureDamage: DamageFile = {
  ...sharedDamage,
  rules: [...sharedDamage.rules, ...toolDamageRules],
  vehicleSeats: [...sharedDamage.vehicleSeats, ...toolVehicleSeats],
};

export const testCatalog = buildCatalog({
  items: { ...sharedItems, items: fixtureItems },
  tags: sharedTags,
  roles: sharedRoles,
});

export function fixtureVehicle(name: string): Vehicle {
  const vehicle = vehiclesFile.vehicles.find((candidate) => candidate.name === name);
  if (!vehicle) throw new Error(`No fixture vehicle ${name}`);
  return vehicle;
}
