import type { BuildsFile } from "@/core/data";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function buildSummary(file: BuildsFile): string {
  const entry = file.builds.find((candidate) => candidate.build === file.latest);
  const published = entry ? new Date(entry.publishedAt) : null;
  return published && !Number.isNaN(published.getTime())
    ? `Game build ${file.latest}, published ${dateFormat.format(published)}`
    : `Game build ${file.latest}`;
}
