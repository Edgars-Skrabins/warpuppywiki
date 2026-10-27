import type { Projectile } from "@/core/data";
import { dragCoefficient, dragModelOf, type DragModel } from "./dragTables";

export const AIR_DENSITY = 1.225;
export const SPEED_OF_SOUND = 340.3;
export const GRAVITY = 9.81;
export const TIME_STEP = 0.001;
export const MAX_FLIGHT_TIME = 30;

export interface BallisticProjectile {
  massKg: number;
  diameterMm: number;
  formFactor: number;
  dragModel: DragModel;
}

export interface TrajectorySample {
  distance: number;
  height: number;
  time: number;
  velocity: number;
}

interface State {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function ballisticProjectileOf(projectile: Projectile): BallisticProjectile | null {
  const { massKg, diameterMm, drag, propulsion } = projectile;
  const formFactor = drag?.coefficient;
  if (propulsion) return null;
  if (!massKg || !diameterMm || formFactor === null || formFactor === undefined || formFactor <= 0) return null;
  return { massKg, diameterMm, formFactor, dragModel: dragModelOf(drag?.model) };
}

function derivative(projectile: BallisticProjectile, dragFactor: number, s: State): State {
  const v = Math.hypot(s.vx, s.vy);
  const k = dragFactor * projectile.formFactor * dragCoefficient(projectile.dragModel, v / SPEED_OF_SOUND) * v;
  return { x: s.vx, y: s.vy, vx: -k * s.vx, vy: -GRAVITY - k * s.vy };
}

function step(projectile: BallisticProjectile, dragFactor: number, s: State, dt: number): State {
  const add = (a: State, b: State, h: number): State => ({
    x: a.x + b.x * h,
    y: a.y + b.y * h,
    vx: a.vx + b.vx * h,
    vy: a.vy + b.vy * h,
  });
  const k1 = derivative(projectile, dragFactor, s);
  const k2 = derivative(projectile, dragFactor, add(s, k1, dt / 2));
  const k3 = derivative(projectile, dragFactor, add(s, k2, dt / 2));
  const k4 = derivative(projectile, dragFactor, add(s, k3, dt));
  return {
    x: s.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: s.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    vx: s.vx + (dt / 6) * (k1.vx + 2 * k2.vx + 2 * k3.vx + k4.vx),
    vy: s.vy + (dt / 6) * (k1.vy + 2 * k2.vy + 2 * k3.vy + k4.vy),
  };
}

export function simulate(
  projectile: BallisticProjectile,
  muzzleVelocity: number,
  launchAngle: number,
  maxDistance: number,
): TrajectorySample[] {
  const area = (Math.PI * (projectile.diameterMm / 1000) ** 2) / 4;
  const dragFactor = (AIR_DENSITY * area) / (2 * projectile.massKg);
  let state: State = {
    x: 0,
    y: 0,
    vx: muzzleVelocity * Math.cos(launchAngle),
    vy: muzzleVelocity * Math.sin(launchAngle),
  };
  let time = 0;
  const samples: TrajectorySample[] = [{ distance: 0, height: 0, time: 0, velocity: muzzleVelocity }];
  while (samples.length <= maxDistance && time < MAX_FLIGHT_TIME && state.vx > 0) {
    const next = step(projectile, dragFactor, state, TIME_STEP);
    while (samples.length <= maxDistance && next.x >= samples.length) {
      const distance = samples.length;
      const t = (distance - state.x) / (next.x - state.x);
      samples.push({
        distance,
        height: state.y + (next.y - state.y) * t,
        time: time + TIME_STEP * t,
        velocity: Math.hypot(state.vx + (next.vx - state.vx) * t, state.vy + (next.vy - state.vy) * t),
      });
    }
    state = next;
    time += TIME_STEP;
  }
  return samples;
}
