import type { TrajectorySample } from "./trajectory";
import { SIGHT_HEIGHT } from "./zero";

export const LEAD_TARGET_SPEED = 5;
const FINE_STEP = 25;
const FINE_LIMIT = 300;
const COARSE_STEP = 50;

export interface RangeCardRow {
  distance: number;
  dropCm: number;
  mils: number;
  time: number;
  velocity: number;
  energy: number;
  falloff: number;
  damage: number;
  lead: number;
}

export interface RangeCardInput {
  samples: readonly TrajectorySample[];
  massKg: number;
  baseDamage: number;
  falloff: (distance: number) => number;
  sightHeight?: number;
}

export function cardDistances(maxDistance: number): number[] {
  const distances: number[] = [];
  for (let d = FINE_STEP; d <= Math.min(FINE_LIMIT, maxDistance); d += FINE_STEP) distances.push(d);
  for (let d = FINE_LIMIT + COARSE_STEP; d <= maxDistance; d += COARSE_STEP) distances.push(d);
  return distances;
}

export function heightAboveSight(sample: TrajectorySample, sightHeight: number = SIGHT_HEIGHT): number {
  return sample.height - sightHeight;
}

export function holdoverMils(dropMetres: number, distance: number): number {
  return Math.round((dropMetres / distance) * 1000 * 10) / 10;
}

export function rangeCard({
  samples,
  massKg,
  baseDamage,
  falloff,
  sightHeight = SIGHT_HEIGHT,
}: RangeCardInput): RangeCardRow[] {
  const maxDistance = samples.length - 1;
  return cardDistances(maxDistance).flatMap((distance) => {
    const sample = samples[distance];
    if (!sample) return [];
    const drop = heightAboveSight(sample, sightHeight);
    const multiplier = falloff(distance);
    return [
      {
        distance,
        dropCm: drop * 100,
        mils: holdoverMils(drop, distance),
        time: sample.time,
        velocity: sample.velocity,
        energy: 0.5 * massKg * sample.velocity ** 2,
        falloff: multiplier,
        damage: baseDamage * multiplier,
        lead: sample.time * LEAD_TARGET_SPEED,
      },
    ];
  });
}
