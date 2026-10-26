import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { sameId } from "@/core/catalog";
import { MAX_COMPARE } from "./logic/vehicleCompare";

export type VehiclesView = "table" | "compare";

export const COMPARE_PARAM = "compare";

export const VIEW_PARAM = "view";

export function parseCompareIds(raw: string | null): string[] {
  if (raw === null) return [];
  const ids: string[] = [];
  for (const part of raw.split(",")) {
    const id = part.trim();
    if (id !== "" && !ids.some((existing) => sameId(existing, id))) ids.push(id);
  }
  return ids.slice(0, MAX_COMPARE);
}

export function toggleCompareId(ids: readonly string[], id: string): string[] {
  if (ids.some((existing) => sameId(existing, id))) {
    return ids.filter((existing) => !sameId(existing, id));
  }
  return ids.length >= MAX_COMPARE ? [...ids] : [...ids, id];
}

export function parseView(raw: string | null): VehiclesView {
  return raw === "compare" ? "compare" : "table";
}

export function useVehiclesState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const compareRaw = searchParams.get(COMPARE_PARAM);
  const compareIds = useMemo(() => parseCompareIds(compareRaw), [compareRaw]);
  const view = parseView(searchParams.get(VIEW_PARAM));

  const setCompareIds = useCallback(
    (ids: readonly string[]) =>
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (ids.length === 0) {
            params.delete(COMPARE_PARAM);
          } else {
            params.set(COMPARE_PARAM, ids.join(","));
          }
          return params;
        },
        { replace: true },
      ),
    [setSearchParams],
  );

  const setView = useCallback(
    (next: VehiclesView) =>
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (next === "table") {
          params.delete(VIEW_PARAM);
        } else {
          params.set(VIEW_PARAM, next);
        }
        return params;
      }),
    [setSearchParams],
  );

  return { view, setView, compareIds, setCompareIds };
}
