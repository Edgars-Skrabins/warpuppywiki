import type { z } from "zod";
import { buildFileUrl } from "./builds";
import { DataValidationError, fetchJson } from "./fetchJson";
import {
  DATA_FILES,
  buildFilePath,
  worldFilePath,
  type BuildFileKey,
  type DataOf,
  type World,
  type WorldFileKey,
} from "./files";

const MAX_ISSUES = 10;

export function formatIssues(error: z.ZodError): string[] {
  return error.issues
    .slice(0, MAX_ISSUES)
    .map((issue) => `${issue.path.length > 0 ? issue.path.join(".") : "(root)"}: ${issue.message}`);
}

export async function loadValidated<S extends z.ZodType>(url: string, schema: S): Promise<z.infer<S>> {
  const json = await fetchJson(url);
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new DataValidationError(url, formatIssues(result.error));
  }
  return result.data;
}

export function loadDataFile<K extends BuildFileKey>(key: K, build: string): Promise<DataOf<K>> {
  return loadValidated(buildFileUrl(build, buildFilePath(key)), DATA_FILES[key].schema) as Promise<DataOf<K>>;
}

export function loadWorldFile<K extends WorldFileKey>(world: World, key: K, build: string): Promise<DataOf<K>> {
  return loadValidated(buildFileUrl(build, worldFilePath(world, key)), DATA_FILES[key].schema) as Promise<DataOf<K>>;
}

export function loadRaw(key: BuildFileKey, build: string): Promise<unknown> {
  return fetchJson(buildFileUrl(build, buildFilePath(key)));
}

export function loadRawWorld(world: World, key: WorldFileKey, build: string): Promise<unknown> {
  return fetchJson(buildFileUrl(build, worldFilePath(world, key)));
}
