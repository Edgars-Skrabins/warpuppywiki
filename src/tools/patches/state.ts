import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { categoryById } from "./diff/categories";
import type { EntityDiff } from "./diff/types";

export type EntityFilter = "all" | "added" | "removed" | "changed";

export const ENTITY_FILTERS: readonly EntityFilter[] = ["all", "added", "removed", "changed"];

export interface BuildInfo {
  build: string;
  publishedAt: string;
}

export interface PatchState {
  from: string;
  to: string;
  category: string | null;
  entity: string | null;
  filter: EntityFilter;
  search: string;
  showAssets: boolean;
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function buildLabel(build: BuildInfo): string {
  const published = new Date(build.publishedAt);
  return Number.isNaN(published.getTime()) ? build.build : `${build.build} · ${dateFormat.format(published)}`;
}

export function sortBuilds(builds: readonly BuildInfo[]): BuildInfo[] {
  return [...builds].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.build.localeCompare(a.build));
}

export function defaultBuilds(builds: readonly BuildInfo[]): { from: string; to: string } | null {
  const [newest, second] = sortBuilds(builds);
  return newest && second ? { from: second.build, to: newest.build } : null;
}

function isFilter(value: string | null): value is EntityFilter {
  return ENTITY_FILTERS.includes(value as EntityFilter);
}

export function readPatchState(params: URLSearchParams, builds: readonly BuildInfo[]): PatchState | null {
  const defaults = defaultBuilds(builds);
  if (!defaults) {
    return null;
  }
  const known = new Set(builds.map((entry) => entry.build));
  const from = params.get("from");
  const to = params.get("to");
  const category = params.get("c");
  const filter = params.get("f");
  const knownCategory = category !== null && categoryById(category) ? category : null;
  return {
    from: from !== null && known.has(from) ? from : defaults.from,
    to: to !== null && known.has(to) ? to : defaults.to,
    category: knownCategory,
    entity: knownCategory === null ? null : params.get("e") || null,
    filter: isFilter(filter) ? filter : "all",
    search: params.get("q") ?? "",
    showAssets: params.get("assets") === "1",
  };
}

export function writePatchState(state: PatchState): URLSearchParams {
  const params = new URLSearchParams({ from: state.from, to: state.to });
  if (state.category !== null) params.set("c", state.category);
  if (state.category !== null && state.entity !== null) params.set("e", state.entity);
  if (state.filter !== "all") params.set("f", state.filter);
  if (state.search !== "") params.set("q", state.search);
  if (state.showAssets) params.set("assets", "1");
  return params;
}

export function patchSearch(state: PatchState, patch: Partial<PatchState>): string {
  return `?${writePatchState({ ...state, ...patch }).toString()}`;
}

export function usePatchState(builds: readonly BuildInfo[]): [PatchState | null, (patch: Partial<PatchState>) => void] {
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => readPatchState(params, builds), [params, builds]);
  const update = useCallback(
    (patch: Partial<PatchState>) => {
      setParams(
        (previous) => {
          const current = readPatchState(previous, builds);
          return current ? writePatchState({ ...current, ...patch }) : previous;
        },
        { replace: true },
      );
    },
    [builds, setParams],
  );
  return [state, update];
}

export function filterEntities(entities: readonly EntityDiff[], filter: EntityFilter, search: string): EntityDiff[] {
  const query = search.trim().toLowerCase();
  return entities.filter(
    (entity) =>
      (filter === "all" || entity.status === filter) &&
      (query === "" || entity.name.toLowerCase().includes(query) || entity.key.toLowerCase().includes(query)),
  );
}
