export function keysToDelete<T>(keys: readonly T[], cap: number): T[] {
  const excess = keys.length - Math.max(0, cap);
  return excess > 0 ? keys.slice(0, excess) : [];
}
