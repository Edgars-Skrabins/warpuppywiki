import { normalizeId } from "./ids";

export function tagMatches(tag: string, query: string): boolean {
  const normalizedTag = normalizeId(tag);
  const normalizedQuery = normalizeId(query);
  return normalizedTag === normalizedQuery || normalizedTag.startsWith(`${normalizedQuery}.`);
}

export function hasTag(tags: readonly string[], query: string): boolean {
  return tags.some((tag) => tagMatches(tag, query));
}

export function tagsUnder(tags: readonly string[], prefix: string): string[] {
  return tags.filter((tag) => tag.length > prefix.length && tagMatches(tag, prefix));
}

export function stripPrefix(tag: string, prefix: string): string {
  return tagMatches(tag, prefix) && tag.length > prefix.length ? tag.slice(prefix.length + 1) : tag;
}
