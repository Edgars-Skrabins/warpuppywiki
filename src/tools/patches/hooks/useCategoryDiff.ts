import { useMemo } from "react";
import type { CategoryDefinition } from "../diff/categories";
import { diffCategory } from "../diff/diffCategory";
import type { CategoryDiff } from "../diff/types";
import type { BuildFilesState } from "./useBuildFiles";

export type CategoryResult =
  | { definition: CategoryDefinition; status: "loading" }
  | { definition: CategoryDefinition; status: "error"; errors: string[] }
  | { definition: CategoryDefinition; status: "success"; diff: CategoryDiff };

const cache = new Map<string, CategoryDiff>();

export function categoryResult(
  definition: CategoryDefinition,
  files: BuildFilesState,
  showAssets: boolean,
): CategoryResult {
  const errors = definition.files.flatMap((file) => files.errors[file] ?? []);
  if (errors.length > 0) {
    return { definition, status: "error", errors };
  }
  if (!definition.files.every((file) => file in files.from && file in files.to)) {
    return { definition, status: "loading" };
  }
  const key = [files.fromBuild, files.toBuild, definition.id, showAssets].join("|");
  let diff = cache.get(key);
  if (!diff) {
    diff = diffCategory(definition, files.from, files.to, { showAssets });
    cache.set(key, diff);
  }
  return { definition, status: "success", diff };
}

export function useCategoryDiff(
  definition: CategoryDefinition,
  files: BuildFilesState,
  showAssets: boolean,
): CategoryResult {
  return useMemo(() => categoryResult(definition, files, showAssets), [definition, files, showAssets]);
}
