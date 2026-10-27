import { simulateKill, type KillResult } from "@/core/damage";
import { AMMO_TYPE_LABELS } from "@/core/weapons";
import { MAX_SETUPS, setupOf, sharedOf, type CompareState, type MatchupState, type Setup } from "../state";
import { ammoTypesOf, buildScenario, resolveMatchup, type MatchupSources, type ScenarioResult } from "./buildScenario";
import { shotHealthDamage } from "./shotDamage";

export type CompareStatus =
  "ok" | "not-killed" | "explosive" | "no-projectile" | "unknown-weapon" | "no-ammo" | "no-zones";

export interface CompareRow {
  index: number;
  setup: Setup;
  label: string;
  result: ScenarioResult;
  status: CompareStatus;
  stk: number | null;
  ttk: number | null;
  firstShotDamage: number | null;
  dps: number | null;
  needsReload: boolean;
  bestStk: boolean;
  bestTtk: boolean;
}

const TOLERANCE = 1e-9;

function statusOf(result: ScenarioResult, kill: KillResult | null): CompareStatus {
  if (!result.ok) return result.error;
  if (kill === null) return "no-projectile";
  if (!kill.supported) return kill.reason;
  return kill.killed ? "ok" : "not-killed";
}

function labelOf(result: ScenarioResult): string {
  if (result.matchup === null) return "Unknown weapon";
  const ammo = result.matchup.ammo;
  return ammo === null
    ? result.matchup.weapon.name
    : `${result.matchup.weapon.name} · ${AMMO_TYPE_LABELS[ammo.ammoType]}`;
}

function minimum(values: readonly (number | null)[]): number | null {
  const present = values.filter((value): value is number => value !== null && Number.isFinite(value));
  return present.length === 0 ? null : Math.min(...present);
}

function isBest(value: number | null, best: number | null): boolean {
  return value !== null && best !== null && Math.abs(value - best) <= TOLERANCE;
}

function rowFor(state: CompareState, setup: Setup, index: number, sources: MatchupSources): CompareRow {
  const result = buildScenario(state.shared, setup, sources);
  const kill = result.ok ? simulateKill(result.scenario) : null;
  const status = statusOf(result, kill);
  const supported = kill !== null && kill.supported ? kill : null;
  const firstShotDamage = supported === null ? null : shotHealthDamage(supported.shots[0]);
  const rpm = result.matchup?.weapon.stats.rpm ?? null;
  return {
    index,
    setup,
    label: labelOf(result),
    result,
    status,
    stk: status === "ok" ? (supported?.stk ?? null) : null,
    ttk: status === "ok" ? (supported?.ttk ?? null) : null,
    firstShotDamage,
    dps: firstShotDamage !== null && rpm !== null && rpm > 0 ? (firstShotDamage * rpm) / 60 : null,
    needsReload: supported?.needsReload ?? false,
    bestStk: false,
    bestTtk: false,
  };
}

export function compareResults(state: CompareState, sources: MatchupSources): CompareRow[] {
  const rows = state.setups.map((setup, index) => rowFor(state, setup, index, sources));
  const bestStk = minimum(rows.map((row) => row.stk));
  const bestTtk = minimum(rows.map((row) => row.ttk));
  return rows.map((row) => ({ ...row, bestStk: isBest(row.stk, bestStk), bestTtk: isBest(row.ttk, bestTtk) }));
}

export function seedComparison(matchup: MatchupState, sources: MatchupSources): CompareState {
  const shared = sharedOf(matchup);
  const resolved = resolveMatchup(shared, setupOf(matchup), sources);
  if (resolved === null) {
    return { shared, setups: [setupOf(matchup)] };
  }
  const types = ammoTypesOf(resolved.ammoOptions);
  const current = resolved.ammo?.ammoType ?? null;
  const first: Setup = {
    weaponId: resolved.weapon.id,
    ammoType: current ?? matchup.ammoType,
    magazineId: resolved.magazine?.attachment.id ?? null,
  };
  const next = current === null ? undefined : types[(types.indexOf(current) + 1) % types.length];
  return {
    shared,
    setups: next === undefined || next === current ? [first] : [first, { ...first, ammoType: next }],
  };
}

export function addSetup(state: CompareState): CompareState {
  const last = state.setups.at(-1);
  if (last === undefined || state.setups.length >= MAX_SETUPS) return state;
  return { ...state, setups: [...state.setups, { ...last }] };
}

export function duplicateSetup(state: CompareState, index: number): CompareState {
  const setup = state.setups[index];
  if (setup === undefined || state.setups.length >= MAX_SETUPS) return state;
  return { ...state, setups: [...state.setups.slice(0, index + 1), { ...setup }, ...state.setups.slice(index + 1)] };
}

export function removeSetup(state: CompareState, index: number): CompareState {
  if (state.setups.length <= 1) return state;
  return { ...state, setups: state.setups.filter((_, position) => position !== index) };
}

export function updateSetup(state: CompareState, index: number, patch: Partial<Setup>): CompareState {
  return {
    ...state,
    setups: state.setups.map((setup, position) => (position === index ? { ...setup, ...patch } : setup)),
  };
}
