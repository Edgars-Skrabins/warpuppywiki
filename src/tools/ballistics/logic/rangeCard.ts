import type { TrajectorySample } from "./trajectory";

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
  lead: number | null;
}

export interface RangeCardInput {
  samples: readonly TrajectorySample[];
  massKg: number;
  baseDamage: number;
  falloff: (distance: number) => number;
  targetSpeed: number | null;
}

export function cardDistances(maxDistance: number): number[] {
  const distances: number[] = [];
  for (let d = FINE_STEP; d <= Math.min(FINE_LIMIT, maxDistance); d += FINE_STEP) distances.push(d);
  for (let d = FINE_LIMIT + COARSE_STEP; d <= maxDistance; d += COARSE_STEP) distances.push(d);
  return distances;
}

export function heightAboveBore(sample: TrajectorySample): number {
  return sample.height;
}

export function holdoverMils(dropMetres: number, distance: number): number {
  return Math.round((dropMetres / distance) * 1000 * 10) / 10;
}

export function rangeCard({ samples, massKg, baseDamage, falloff, targetSpeed }: RangeCardInput): RangeCardRow[] {
  const maxDistance = samples.length - 1;
  return cardDistances(maxDistance).flatMap((distance) => {
    const sample = samples[distance];
    if (!sample) return [];
    const drop = heightAboveBore(sample);
    const multiplier = falloff(distance);
    return [
      {
        distance,
        dropCm: drop * 100,
        mils: holdoverMils(-drop, distance),
        time: sample.time,
        velocity: sample.velocity,
        energy: 0.5 * massKg * sample.velocity ** 2,
        falloff: multiplier,
        damage: baseDamage * multiplier,
        lead: targetSpeed === null ? null : sample.time * targetSpeed,
      },
    ];
  });
}
