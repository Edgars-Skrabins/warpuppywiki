import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { decodeState, encodeState, type UrlStateCodec } from "./urlCodec";

export const URL_STATE_DEBOUNCE_MS = 250;

export function useUrlState<T>(
  codec: UrlStateCodec<T>,
): [T, (next: T | ((prev: T) => T)) => void, { decodeError: boolean }] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(codec.key);
  const decoded = useMemo(() => decodeState(codec, raw), [codec, raw]);
  const defaultsEncoded = useMemo(() => encodeState(codec, codec.defaults), [codec]);
  const [pending, setPending] = useState<{ state: T; target: string | null } | null>(null);
  const state = pending ? pending.state : decoded.state;

  const latestRef = useRef(state);
  const rawRef = useRef(raw);
  const setSearchParamsRef = useRef(setSearchParams);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    latestRef.current = state;
    rawRef.current = raw;
    setSearchParamsRef.current = setSearchParams;
  });

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const previousRawRef = useRef(raw);

  useEffect(() => {
    const rawChanged = previousRawRef.current !== raw;
    previousRawRef.current = raw;
    if (pending === null || timerRef.current !== undefined) return;
    if (rawChanged || raw === pending.target) {
      setPending(null);
    }
  }, [pending, raw]);

  const setState = useCallback(
    (next: T | ((prev: T) => T)) => {
      const value = typeof next === "function" ? (next as (prev: T) => T)(latestRef.current) : next;
      const encoded = encodeState(codec, value);
      const target = encoded === defaultsEncoded ? null : encoded;
      latestRef.current = value;
      setPending({ state: value, target });
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = undefined;
        if (rawRef.current !== target) {
          setSearchParamsRef.current(
            (prev) => {
              const params = new URLSearchParams(prev);
              if (target === null) {
                params.delete(codec.key);
              } else {
                params.set(codec.key, target);
              }
              return params;
            },
            { replace: true },
          );
        } else {
          setPending(null);
        }
      }, URL_STATE_DEBOUNCE_MS);
    },
    [codec, defaultsEncoded],
  );

  return [state, setState, { decodeError: pending === null && decoded.error }];
}
