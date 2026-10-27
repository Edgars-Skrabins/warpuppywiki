import { DamageFile } from "@/core/data/schemas/damage";
import { VehiclesFile } from "@/core/data/schemas/vehicles";
import damageJson from "@/test/fixtures/data/25937608/damage.json";
import damageExtra from "./damage-extra.json";
import vehiclesJson from "./vehicles.json";

export const damageFixture = {
  ...damageJson,
  rules: [...damageJson.rules, ...damageExtra.rules],
  vehicleSeats: [...damageJson.vehicleSeats, ...damageExtra.vehicleSeats],
};

export const vehiclesFixture = vehiclesJson;

export const damageFile = DamageFile.parse(damageFixture);
export const vehiclesFile = VehiclesFile.parse(vehiclesFixture);
