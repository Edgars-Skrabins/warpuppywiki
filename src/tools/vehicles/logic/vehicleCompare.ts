import { sameId, type UnlockInfo } from "@/core/catalog";
import type { VehicleSeatDamage } from "@/core/data";
import { gearCount, peakTorque } from "./engine";
import type { VehicleRow } from "./vehicleRows";

export const MAX_COMPARE = 3;

export type BetterWhen = "higher" | "lower";

export type CompareFormat =
  "cash" | "speed" | "liters" | "km" | "count" | "rpm" | "torque" | "ratio" | "ms" | "meters" | "kg" | "multiplier";

export type SeatRule = VehicleSeatDamage["rules"][number];

interface CompareRowBase {
  key: string;
  label: string;
}

export interface NumberCompareRow extends CompareRowBase {
  kind: "number";
  format: CompareFormat;
  betterWhen?: BetterWhen;
  values: (number | null)[];
  best: boolean[];
}

export interface TextCompareRow extends CompareRowBase {
  kind: "text";
  values: (readonly string[])[];
}

export interface UnlockCompareRow extends CompareRowBase {
  kind: "unlock";
  values: (UnlockInfo | null)[];
}

export interface ProtectionCompareRow extends CompareRowBase {
  kind: "protection";
  values: (readonly SeatRule[] | null)[];
}

export type CompareRow = NumberCompareRow | TextCompareRow | UnlockCompareRow | ProtectionCompareRow;

export interface CompareSection {
  key: string;
  label: string;
  rows: CompareRow[];
}

export function bestMarkers(values: readonly (number | null)[], betterWhen: BetterWhen | undefined): boolean[] {
  const numbers = values.filter((value): value is number => value !== null);
  if (betterWhen === undefined || numbers.length < 2) return values.map(() => false);
  const best = betterWhen === "higher" ? Math.max(...numbers) : Math.min(...numbers);
  if (numbers.every((value) => value === best)) return values.map(() => false);
  return values.map((value) => value === best);
}

function numberRows(vehicles: readonly VehicleRow[]) {
  return (
    key: string,
    label: string,
    format: CompareFormat,
    value: (row: VehicleRow) => number | null | undefined,
    betterWhen?: BetterWhen,
  ): NumberCompareRow => {
    const values = vehicles.map((row) => value(row) ?? null);
    return { kind: "number", key, label, format, betterWhen, values, best: bestMarkers(values, betterWhen) };
  };
}

export function seatRulesFor(seats: readonly VehicleSeatDamage[], vehicleId: string): readonly SeatRule[] | null {
  return seats.find((entry) => sameId(entry.vehicle, vehicleId))?.rules ?? null;
}

function joinWords(words: readonly string[]): string {
  if (words.length <= 1) return words.join("");
  return `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
}

export function protectionText(
  rules: readonly SeatRule[] | null,
  formatSignedPercent: (value: number) => string,
): string {
  if (rules === null || rules.length === 0) return "No data";
  const text = rules
    .map((rule, index) => {
      const sources = joinWords(rule.damageSources.map((source) => source.toLowerCase()));
      return `${sources}${index === 0 ? " arms" : ""} ${formatSignedPercent(rule.reduction)}`;
    })
    .join(", ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function compareSections(
  vehicles: readonly VehicleRow[],
  seats: readonly VehicleSeatDamage[],
): CompareSection[] {
  const num = numberRows(vehicles);
  return [
    {
      key: "overview",
      label: "Overview",
      rows: [
        num("price", "Price", "cash", (row) => row.price, "lower"),
        { kind: "unlock", key: "unlock", label: "Unlock", values: vehicles.map((row) => row.unlock) },
        num("topSpeed", "Top speed", "speed", (row) => row.topSpeed, "higher"),
        num("fuel", "Fuel", "liters", (row) => row.fuel, "higher"),
        num("range", "Range", "km", (row) => row.range, "higher"),
        num("seats", "Seats", "count", (row) => row.seats, "higher"),
        num("health", "Health", "count", (row) => row.health, "higher"),
        num("criticalThreshold", "Critical threshold", "count", (row) => row.criticalThreshold),
        { kind: "text", key: "weapons", label: "Weapons", values: vehicles.map((row) => row.weapons) },
        {
          kind: "text",
          key: "counterMeasures",
          label: "Countermeasures",
          values: vehicles.map((row) => row.counterMeasures),
        },
        num("mass", "Mass", "kg", (row) => row.mass),
      ],
    },
    {
      key: "engine",
      label: "Engine",
      rows: [
        num("idleRpm", "Idle RPM", "rpm", (row) => row.vehicle.engine?.idleRpm),
        num("limitRpm", "Limit RPM", "rpm", (row) => row.vehicle.engine?.limitRpm),
        num("peakTorque", "Peak torque", "torque", (row) => peakTorque(row.vehicle.engine)?.torque),
        num("peakTorqueRpm", "Peak torque at", "rpm", (row) => peakTorque(row.vehicle.engine)?.rpm),
        num("boostScale", "Boost scale", "multiplier", (row) => row.vehicle.engine?.boostScale),
      ],
    },
    {
      key: "gearbox",
      label: "Gearbox",
      rows: [
        num("gears", "Gears", "count", (row) => gearCount(row.vehicle.transmission)),
        num("finalRatio", "Final ratio", "ratio", (row) => row.vehicle.transmission?.finalGearRatio),
        num("shiftTime", "Shift time", "ms", (row) => row.vehicle.transmission?.changeTime),
      ],
    },
    {
      key: "explosion",
      label: "Destroyed explosion",
      rows: [
        num("explosionRadius", "Radius", "meters", (row) => row.vehicle.destroyedExplosion?.radius),
        num(
          "explosionEffective",
          "Effective radius",
          "meters",
          (row) => row.vehicle.destroyedExplosion?.effectiveRadius,
        ),
      ],
    },
    {
      key: "protection",
      label: "Occupant protection",
      rows: [
        {
          kind: "protection",
          key: "occupantProtection",
          label: "Damage to occupants",
          values: vehicles.map((row) => seatRulesFor(seats, row.id)),
        },
      ],
    },
  ];
}
