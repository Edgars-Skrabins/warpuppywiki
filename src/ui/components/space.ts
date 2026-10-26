export type SpaceToken = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export function spaceVar(space: SpaceToken): string {
  return space === 0 ? "0" : `var(--space-${space})`;
}
