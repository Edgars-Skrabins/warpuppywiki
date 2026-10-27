import { useMemo } from "react";
import { useRawGameDataMany, useRawWorldDataMany, type DataState } from "@/core/data";
import { FILE_REFS, type BuildFiles, type FileRef } from "../diff/categories";

export interface BuildFilesState {
  fromBuild: string;
  toBuild: string;
  from: BuildFiles;
  to: BuildFiles;
  loaded: number;
  total: number;
  errors: Readonly<Record<string, string[]>>;
}

type BuildRef = Extract<FileRef, { scope: "build" }>;
type WorldRef = Extract<FileRef, { scope: "world" }>;

function useRefs(fileIds: readonly string[]) {
  return useMemo(() => {
    const refs = fileIds.flatMap((id) => FILE_REFS[id] ?? []);
    const build = refs.filter((ref): ref is BuildRef => ref.scope === "build");
    const world = refs.filter((ref): ref is WorldRef => ref.scope === "world");
    return {
      ordered: [...build, ...world],
      buildKeys: build.map((ref) => ref.key),
      worldFiles: world.map((ref) => ({ world: ref.world, key: ref.key })),
    };
  }, [fileIds]);
}

function useStates(refs: ReturnType<typeof useRefs>, build: string): DataState<unknown>[] {
  return [...useRawGameDataMany(refs.buildKeys, { build }), ...useRawWorldDataMany(refs.worldFiles, { build })];
}

export function useBuildFiles(fileIds: readonly string[], fromBuild: string, toBuild: string): BuildFilesState {
  const refs = useRefs(fileIds);
  const fromStates = useStates(refs, fromBuild);
  const toStates = useStates(refs, toBuild);
  const from: Record<string, unknown> = {};
  const to: Record<string, unknown> = {};
  const errors: Record<string, string[]> = {};
  let loaded = 0;
  const collect = (states: DataState<unknown>[], files: Record<string, unknown>, build: string) => {
    states.forEach((state, index) => {
      const ref = refs.ordered[index]!;
      if (state.status === "success") {
        files[ref.id] = state.data;
        loaded += 1;
      } else if (state.status === "error") {
        errors[ref.id] = [...(errors[ref.id] ?? []), `Couldn't load ${ref.fileName} for build ${build}`];
        loaded += 1;
      }
    });
  };
  collect(fromStates, from, fromBuild);
  collect(toStates, to, toBuild);
  return { fromBuild, toBuild, from, to, loaded, total: refs.ordered.length * 2, errors };
}
