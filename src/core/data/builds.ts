import { z } from "zod";

export const BuildEntry = z.looseObject({
  build: z.string(),
  publishedAt: z.string(),
  name: z.string(),
});

export const BuildsFile = z.looseObject({
  schemaVersion: z.literal(1),
  latest: z.string(),
  builds: z.array(BuildEntry),
});

export function dataRoot(): string {
  return `${import.meta.env.BASE_URL}data/`;
}

export function buildsUrl(): string {
  return `${dataRoot()}builds.json`;
}

export function buildFileUrl(build: string, path: string): string {
  return `${dataRoot()}${build}/${path}`;
}

export function assetsManifestUrl(): string {
  return `${import.meta.env.BASE_URL}assets/manifest.json`;
}

export function latestBuild(file: z.infer<typeof BuildsFile>): string {
  return file.latest;
}
