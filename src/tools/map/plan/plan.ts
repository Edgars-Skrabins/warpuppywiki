import { z } from "zod";
import { WORLDS, type World } from "@/core/data";
import type { Vec2 } from "@/core/maps";

export const PLAN_LIMITS = {
  pins: 30,
  ringSets: 5,
  measurePoints: 50,
  labelLength: 40,
  ringDistances: 8,
  minRingDistance: 10,
  maxRingDistance: 20_000,
} as const;

export const PIN_COLORS = ["yellow", "blue", "olive", "violet", "orange", "teal"] as const;

export type PinColor = (typeof PIN_COLORS)[number];

export const PIN_COLOR_TOKENS: Record<PinColor, string> = {
  yellow: "--chart-1",
  blue: "--chart-2",
  olive: "--chart-3",
  violet: "--chart-4",
  orange: "--chart-5",
  teal: "--chart-6",
};

export const PIN_COLOR_LABELS: Record<PinColor, string> = {
  yellow: "Yellow",
  blue: "Blue",
  olive: "Olive",
  violet: "Violet",
  orange: "Orange",
  teal: "Teal",
};

export const PIN_ICONS = ["flag", "target", "skull", "cross", "star", "circle"] as const;

export type PinIcon = (typeof PIN_ICONS)[number];

export const PIN_ICON_LABELS: Record<PinIcon, string> = {
  flag: "Flag",
  target: "Target",
  skull: "Skull",
  cross: "Cross",
  star: "Star",
  circle: "Circle",
};

const Coordinate = z.number().refine(Number.isFinite);

export const Position = z.tuple([Coordinate, Coordinate]);

export const Pin = z.object({
  id: z.number().int().positive(),
  position: Position,
  label: z.string().max(PLAN_LIMITS.labelLength),
  color: z.enum(PIN_COLORS),
  icon: z.enum(PIN_ICONS),
});

export const RingSet = z.object({
  id: z.number().int().positive(),
  center: Position,
  distances: z
    .array(z.number().min(PLAN_LIMITS.minRingDistance).max(PLAN_LIMITS.maxRingDistance))
    .min(1)
    .max(PLAN_LIMITS.ringDistances),
});

export const Plan = z.object({
  measure: z.array(Position).max(PLAN_LIMITS.measurePoints),
  rings: z.array(RingSet).max(PLAN_LIMITS.ringSets),
  pins: z.array(Pin).max(PLAN_LIMITS.pins),
});

export type Pin = z.infer<typeof Pin>;
export type RingSet = z.infer<typeof RingSet>;
export type Plan = z.infer<typeof Plan>;
export type PinChanges = Partial<Pick<Pin, "label" | "color" | "icon">> & { position?: Vec2 };

export const Plans = z.object(Object.fromEntries(WORLDS.map((world) => [world, Plan])) as Record<World, typeof Plan>);

export function emptyPlan(): Plan {
  return { measure: [], rings: [], pins: [] };
}

export function emptyPlans(): Record<World, Plan> {
  return Object.fromEntries(WORLDS.map((world) => [world, emptyPlan()])) as Record<World, Plan>;
}

export function roundPosition([x, y]: Vec2): [number, number] {
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

export function isPlanEmpty(plan: Plan): boolean {
  return plan.measure.length === 0 && plan.rings.length === 0 && plan.pins.length === 0;
}

function nextId(items: readonly { id: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

export function pinLabel(id: number): string {
  return `Pin ${id}`;
}

export function addPin(plan: Plan, position: Vec2): { plan: Plan; pin: Pin } | null {
  if (plan.pins.length >= PLAN_LIMITS.pins) {
    return null;
  }
  const id = nextId(plan.pins);
  const pin: Pin = { id, position: roundPosition(position), label: pinLabel(id), color: "yellow", icon: "flag" };
  return { plan: { ...plan, pins: [...plan.pins, pin] }, pin };
}

export function cleanLabel(label: string, id: number): string {
  const trimmed = label.trim().slice(0, PLAN_LIMITS.labelLength);
  return trimmed === "" ? pinLabel(id) : trimmed;
}

export function updatePin(plan: Plan, id: number, changes: PinChanges): Plan {
  return {
    ...plan,
    pins: plan.pins.map((pin) =>
      pin.id === id
        ? {
            ...pin,
            ...changes,
            label: changes.label === undefined ? pin.label : cleanLabel(changes.label, id),
            position: changes.position === undefined ? pin.position : roundPosition(changes.position),
          }
        : pin,
    ),
  };
}

export function removePin(plan: Plan, id: number): Plan {
  return { ...plan, pins: plan.pins.filter((pin) => pin.id !== id) };
}

export function addRingSet(plan: Plan, center: Vec2, distances: readonly number[]): Plan | null {
  if (plan.rings.length >= PLAN_LIMITS.ringSets || distances.length === 0) {
    return null;
  }
  const ringSet: RingSet = {
    id: nextId(plan.rings),
    center: roundPosition(center),
    distances: distances.slice(0, PLAN_LIMITS.ringDistances),
  };
  return { ...plan, rings: [...plan.rings, ringSet] };
}

export function removeRingSet(plan: Plan, id: number): Plan {
  return { ...plan, rings: plan.rings.filter((ringSet) => ringSet.id !== id) };
}

export function addMeasurePoint(points: Plan["measure"], point: Vec2): Plan["measure"] | null {
  const rounded = roundPosition(point);
  const last = points.at(-1);
  if (last !== undefined && last[0] === rounded[0] && last[1] === rounded[1]) {
    return null;
  }
  if (points.length >= PLAN_LIMITS.measurePoints) {
    return null;
  }
  return [...points, rounded];
}
