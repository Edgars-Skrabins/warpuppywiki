import { useCallback } from "react";
import { useSearchParams } from "react-router";
import { defineUrlState, encodeState, StateTooLargeError, type UrlStateCodec } from "@/core/state";
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

export function useLoadoutLink(): [LoadoutLink, (link: LoadoutLink) => void] {
  const [params, setParams] = useSearchParams();
  const setLink = useCallback(
    (link: LoadoutLink) => setParams((prev) => withLoadoutLink(prev, link), { replace: true }),
    [setParams],
  );
  return [readLoadoutLink(params), setLink];
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
