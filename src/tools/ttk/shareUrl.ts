import { encodeState } from "@/core/state";
import { compareCodec, matchupCodec, type CompareState, type MatchupState } from "./state";

function base(): string {
  return `${window.location.origin}${window.location.pathname}#/ttk`;
}

export function singleUrl(state: MatchupState): string {
  return `${base()}?m=${encodeState(matchupCodec, state)}`;
}

export function compareUrl(state: CompareState): string {
  return `${base()}?mode=compare&c=${encodeState(compareCodec, state)}`;
}
