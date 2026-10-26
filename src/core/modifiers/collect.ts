import type { Modifier, SourcedModifier } from "./types";

export interface ModifierSource {
  label: string;
  modifiers: readonly Modifier[];
}

export function collect(sources: readonly ModifierSource[], attribute: string): SourcedModifier[] {
  const wanted = attribute.toLowerCase();
  return sources.flatMap((source) =>
    source.modifiers
      .filter((modifier) => modifier.attribute.toLowerCase() === wanted)
      .map((modifier) => ({ source: source.label, modifier })),
  );
}
