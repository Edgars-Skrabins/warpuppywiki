import { tagLabel } from "./contextTags";
import type { Condition, ConditionGroup } from "./types";

function tagMatches(tag: string, query: string): boolean {
  const lowerTag = tag.toLowerCase();
  const lowerQuery = query.toLowerCase();
  return lowerTag === lowerQuery || lowerTag.startsWith(`${lowerQuery}.`);
}

function tagIsOn(tags: readonly string[], query: string): boolean {
  return tags.some((tag) => tagMatches(tag, query));
}

function holds(match: Condition["match"], results: boolean[]): boolean {
  switch (match) {
    case "all":
      return results.every(Boolean);
    case "any":
      return results.some(Boolean);
    case "none":
      return !results.some(Boolean);
  }
}

function groupHolds(group: ConditionGroup, tags: readonly string[]): boolean {
  return holds(
    group.match,
    group.tags.map((query) => tagIsOn(tags, query)),
  );
}

export function conditionHolds(when: Condition, tags: readonly string[]): boolean {
  return holds(when.match, [
    ...(when.tags ?? []).map((query) => tagIsOn(tags, query)),
    ...(when.of ?? []).map((group) => groupHolds(group, tags)),
  ]);
}

function listText(labels: string[], conjunction: string): string {
  if (labels.length <= 1) {
    return labels.join("");
  }
  return `${labels.slice(0, -1).join(", ")} ${conjunction} ${labels[labels.length - 1]}`;
}

function groupText(group: ConditionGroup): string {
  const labels = group.tags.map(tagLabel);
  const plural = labels.length > 1;
  switch (group.match) {
    case "all":
      return `${listText(labels, "and")} ${plural ? "are" : "is"} on`;
    case "any":
      return `${listText(labels, "or")} is on`;
    case "none":
      return `${listText(labels, "and")} ${plural ? "are" : "is"} off`;
  }
}

export function describeCondition(when: Condition): string {
  const tags = when.tags ?? [];
  const groups = when.of ?? [];
  if (groups.length === 0) {
    return groupText({ match: when.match, tags });
  }
  if (when.match === "none") {
    const parts = [...(tags.length > 0 ? [groupText({ match: "any", tags })] : []), ...groups.map(groupText)];
    return `not (${listText(parts, "or")})`;
  }
  const parts = [...(tags.length > 0 ? [groupText({ match: when.match, tags })] : []), ...groups.map(groupText)];
  return listText(parts, when.match === "all" ? "and" : "or");
}
