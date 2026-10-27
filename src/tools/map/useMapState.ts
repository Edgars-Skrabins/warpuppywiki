import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import { encodeState, StateTooLargeError, useUrlState } from "@/core/state";
import { mapStateCodec, type MapState } from "./state";

export interface MapStateMeta {
  shareUrl: string | null;
}

function encodedOrNull(state: MapState): string | null {
  try {
    return encodeState(mapStateCodec, state);
  } catch (error) {
    if (error instanceof StateTooLargeError) {
      return null;
    }
    throw error;
  }
}

export function useMapState(): [MapState, (update: (prev: MapState) => MapState) => void, MapStateMeta] {
  const [urlState, setUrlState] = useUrlState(mapStateCodec);
  const [overflow, setOverflow] = useState<MapState | null>(null);
  const location = useLocation();
  const state = overflow ?? urlState;
  const latest = useRef(state);

  useEffect(() => {
    latest.current = state;
  });

  const update = useCallback(
    (fn: (prev: MapState) => MapState) => {
      const next = fn(latest.current);
      latest.current = next;
      if (encodedOrNull(next) === null) {
        setOverflow(next);
        return;
      }
      setOverflow(null);
      setUrlState(next);
    },
    [setUrlState],
  );

  const shareUrl = useMemo(() => {
    const encoded = encodedOrNull(state);
    if (encoded === null) {
      return null;
    }
    const params = new URLSearchParams(location.search);
    params.set(mapStateCodec.key, encoded);
    const { origin, pathname, search } = window.location;
    return `${origin}${pathname}${search}#${location.pathname}?${params.toString()}`;
  }, [state, location.pathname, location.search]);

  return [state, update, { shareUrl }];
}
