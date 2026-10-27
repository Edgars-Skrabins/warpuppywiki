import { useCallback } from "react";
import { useSearchParams } from "react-router";

export const BUILDABLE_PARAM = "b";

export function useBuildablesState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get(BUILDABLE_PARAM);

  const setSelectedId = useCallback(
    (id: string | null) =>
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (id === null) {
          params.delete(BUILDABLE_PARAM);
        } else {
          params.set(BUILDABLE_PARAM, id);
        }
        return params;
      }),
    [setSearchParams],
  );

  return { selectedId, setSelectedId };
}
