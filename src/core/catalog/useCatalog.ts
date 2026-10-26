import { useMemo } from "react";
import { useGameDataMany, type DataState } from "@/core/data";
import { buildCatalog, type Catalog } from "./catalog";

const CATALOG_FILES = ["items", "tags", "roles"] as const;

export function useCatalog(): DataState<Catalog> {
  const state = useGameDataMany(CATALOG_FILES);
  const files = state.status === "success" ? state.data : undefined;
  const items = files?.items;
  const tags = files?.tags;
  const roles = files?.roles;
  const catalog = useMemo(
    () => (items && tags && roles ? buildCatalog({ items, tags, roles }) : undefined),
    [items, tags, roles],
  );
  if (state.status !== "success") {
    return state;
  }
  return catalog === undefined ? { status: "loading" } : { status: "success", data: catalog };
}
