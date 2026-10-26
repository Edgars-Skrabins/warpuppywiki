import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import type { BuildEntry, BuildsIndex } from "./releases";

export interface DeployInfo {
  commit: string;
  builds: { latest: string; list: BuildEntry[] };
  builtAt: string;
  fingerprint: string;
}

export function deployFingerprint(commit: string, index: BuildsIndex): string {
  const builds = index.builds.map(({ build, publishedAt }) => ({ build, publishedAt }));
  return createHash("sha256")
    .update(JSON.stringify({ commit, latest: index.latest, builds }))
    .digest("hex");
}

export function deployInfo(commit: string, index: BuildsIndex, builtAt: Date): DeployInfo {
  return {
    commit,
    builds: { latest: index.latest, list: index.builds },
    builtAt: builtAt.toISOString(),
    fingerprint: deployFingerprint(commit, index),
  };
}

export function currentCommit(): string {
  return process.env.GITHUB_SHA || execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
}
