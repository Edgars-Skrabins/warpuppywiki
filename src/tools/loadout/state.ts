import { useCallback } from "react";
import { useSearchParams } from "react-router";
import { defineUrlState, encodeState, StateTooLargeError, type UrlStateCodec } from "@/core/state";
import { parseSideParam, sideParam, type SideSource } from "./compare/sideSource";
import { emptyLoadout, Loadout } from "./model/loadout";

export const LOADOUT_URL_KEY = "l";
export const SAVED_ID_PARAM = "id";
export const SHARED_PARAM = "shared";

export function loadoutCodec(defaultBudget: number): UrlStateCodec<Loadout> {
  return defineUrlState({
    key: LOADOUT_URL_KEY,
    version: 1,
    schema: Loadout,
    defaults: emptyLoadout(defaultBudget),
  });
}

export interface LoadoutLink {
  savedId: string | null;
  shared: boolean;
}

export function readLoadoutLink(params: URLSearchParams): LoadoutLink {
  const savedId = params.get(SAVED_ID_PARAM);
  return { savedId: savedId === null || savedId === "" ? null : savedId, shared: params.get(SHARED_PARAM) === "1" };
}

export function withLoadoutLink(params: URLSearchParams, link: LoadoutLink): URLSearchParams {
  const next = new URLSearchParams(params);
  if (link.savedId === null) {
    next.delete(SAVED_ID_PARAM);
  } else {
    next.set(SAVED_ID_PARAM, link.savedId);
  }
  if (link.shared) {
    next.set(SHARED_PARAM, "1");
  } else {
    next.delete(SHARED_PARAM);
  }
  return next;
}

export type ShareLink = { ok: true; url: string } | { ok: false; reason: "too-large" };

export function shareLink(codec: UrlStateCodec<Loadout>, loadout: Loadout, pageUrl: string, route: string): ShareLink {
  let encoded: string;
  try {
    encoded = encodeState(codec, loadout);
  } catch (error) {
    if (error instanceof StateTooLargeError) {
      return { ok: false, reason: "too-large" };
    }
    throw error;
  }
  const params = new URLSearchParams({ [codec.key]: encoded, [SHARED_PARAM]: "1" });
  return { ok: true, url: `${pageUrl.split("#")[0]}#${route}?${params.toString()}` };
}

export const VIEW_PARAM = "view";
export const COMPARE_VIEW = "compare";
export const SIDE_A_PARAM = "a";
export const SIDE_B_PARAM = "b";

export interface CompareLink {
  a: SideSource;
  b: SideSource;
}

export function readCompareLink(params: URLSearchParams): CompareLink | null {
  if (params.get(VIEW_PARAM) !== COMPARE_VIEW) {
    return null;
  }
  return {
    a: parseSideParam(params.get(SIDE_A_PARAM), { kind: "current" }),
    b: parseSideParam(params.get(SIDE_B_PARAM), { kind: "empty" }),
  };
}

export function withCompareLink(params: URLSearchParams, link: CompareLink | null): URLSearchParams {
  const next = new URLSearchParams(params);
  if (link === null) {
    next.delete(VIEW_PARAM);
    next.delete(SIDE_A_PARAM);
    next.delete(SIDE_B_PARAM);
  } else {
    next.set(VIEW_PARAM, COMPARE_VIEW);
    next.set(SIDE_A_PARAM, sideParam(link.a));
    next.set(SIDE_B_PARAM, sideParam(link.b));
  }
  return next;
}

export interface LoadoutParamsUpdate {
  link?: LoadoutLink;
  compare?: CompareLink | null;
}

export interface LoadoutParams {
  link: LoadoutLink;
  compare: CompareLink | null;
  update: (changes: LoadoutParamsUpdate) => void;
}

export function useLoadoutParams(): LoadoutParams {
  const [params, setParams] = useSearchParams();
  const update = useCallback(
    (changes: LoadoutParamsUpdate) =>
      setParams((prev) => {
        const withLink = changes.link === undefined ? prev : withLoadoutLink(prev, changes.link);
        return changes.compare === undefined ? withLink : withCompareLink(withLink, changes.compare);
      }),
    [setParams],
  );
  return { link: readLoadoutLink(params), compare: readCompareLink(params), update };
}
