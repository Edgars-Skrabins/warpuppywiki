import { skipToken, useQueries, useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { z } from "zod";
import { assetsManifestUrl, buildsUrl, BuildsFile } from "./builds";
import { DataMissingError, type DataError } from "./fetchJson";
import type { BuildFileKey, DataOf, World, WorldFileKey } from "./files";
import { loadDataFile, loadRaw, loadRawWorld, loadValidated, loadWorldFile } from "./loadDataFile";
import { queryKeys } from "./queryKeys";
import { AssetsManifest } from "./schemas/assetsManifest";

export type DataState<T> =
  { status: "loading" } | { status: "error"; error: DataError } | { status: "success"; data: T };

type BuildOption = { build?: string };

function toState<T>(query: UseQueryResult<T>): DataState<T> {
  if (query.status === "success") {
    return { status: "success", data: query.data };
  }
  if (query.status === "error") {
    return { status: "error", error: query.error as DataError };
  }
  return { status: "loading" };
}

export function useBuilds(): DataState<z.infer<typeof BuildsFile>> {
  const query = useQuery({
    queryKey: queryKeys.builds(),
    queryFn: () => loadValidated(buildsUrl(), BuildsFile),
  });
  return toState(query);
}

export function useLatestBuild(): DataState<string> {
  const builds = useBuilds();
  return builds.status === "success" ? { status: "success", data: builds.data.latest } : builds;
}

function useResolvedBuild(opts: BuildOption | undefined): DataState<string> {
  const latest = useLatestBuild();
  return opts?.build === undefined ? latest : { status: "success", data: opts.build };
}

export function useGameData<K extends BuildFileKey>(key: K, opts?: BuildOption): DataState<DataOf<K>> {
  const build = useResolvedBuild(opts);
  const query = useQuery({
    queryKey: queryKeys.data(build.status === "success" ? build.data : "", key),
    queryFn: build.status === "success" ? () => loadDataFile(key, build.data) : skipToken,
  });
  return build.status === "success" ? toState(query) : build;
}

export function useGameDataMany<const Ks extends readonly BuildFileKey[]>(
  keys: Ks,
  opts?: BuildOption,
): DataState<{ [I in Ks[number]]: DataOf<I> }> {
  const build = useResolvedBuild(opts);
  const queries = useQueries({
    queries: keys.map((key) => ({
      queryKey: queryKeys.data(build.status === "success" ? build.data : "", key),
      queryFn: build.status === "success" ? () => loadDataFile(key, build.data) : skipToken,
    })),
  });
  if (build.status !== "success") {
    return build;
  }
  const failed = queries.find((query) => query.status === "error");
  if (failed) {
    return { status: "error", error: failed.error as DataError };
  }
  if (queries.some((query) => query.status !== "success")) {
    return { status: "loading" };
  }
  const data = Object.fromEntries(keys.map((key, index) => [key, queries[index]?.data]));
  return { status: "success", data: data as { [I in Ks[number]]: DataOf<I> } };
}

export function useWorldData<K extends WorldFileKey>(world: World, key: K, opts?: BuildOption): DataState<DataOf<K>> {
  const build = useResolvedBuild(opts);
  const query = useQuery({
    queryKey: queryKeys.world(build.status === "success" ? build.data : "", world, key),
    queryFn: build.status === "success" ? () => loadWorldFile(world, key, build.data) : skipToken,
  });
  return build.status === "success" ? toState(query) : build;
}

export function useRawGameData(key: BuildFileKey, opts: { build: string }): DataState<unknown> {
  const query = useQuery({
    queryKey: queryKeys.raw(opts.build, key),
    queryFn: () => loadRaw(key, opts.build),
  });
  return toState(query);
}

export function useRawGameDataMany(keys: readonly BuildFileKey[], opts: { build: string }): DataState<unknown>[] {
  const queries = useQueries({
    queries: keys.map((key) => ({
      queryKey: queryKeys.raw(opts.build, key),
      queryFn: () => loadRaw(key, opts.build),
    })),
  });
  return queries.map(toState);
}

export type WorldFileRef = { world: World; key: WorldFileKey };

export function useRawWorldDataMany(files: readonly WorldFileRef[], opts: { build: string }): DataState<unknown>[] {
  const queries = useQueries({
    queries: files.map(({ world, key }) => ({
      queryKey: queryKeys.rawWorld(opts.build, world, key),
      queryFn: () => loadRawWorld(world, key, opts.build),
    })),
  });
  return queries.map(toState);
}

async function loadAssetsManifest(): Promise<z.infer<typeof AssetsManifest> | null> {
  try {
    return await loadValidated(assetsManifestUrl(), AssetsManifest);
  } catch (error) {
    if (error instanceof DataMissingError) {
      return null;
    }
    throw error;
  }
}

export function useAssetsManifest(): DataState<z.infer<typeof AssetsManifest> | null> {
  const query = useQuery({
    queryKey: queryKeys.assetsManifest(),
    queryFn: loadAssetsManifest,
  });
  return toState(query);
}
