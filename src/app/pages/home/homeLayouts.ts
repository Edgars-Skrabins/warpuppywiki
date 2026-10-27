import { z } from "zod";
import { createStore } from "@/core/state";

export const HOME_LAYOUTS = [
  { id: "manual", label: "Manual" },
  { id: "tiles", label: "Tiles" },
  { id: "terminal", label: "Terminal" },
  { id: "columns", label: "Columns" },
  { id: "briefing", label: "Briefing" },
] as const;

export type HomeLayoutId = (typeof HOME_LAYOUTS)[number]["id"];

const LayoutId = z.enum(["manual", "tiles", "terminal", "columns", "briefing"]);

export const homeLayoutStore = createStore<HomeLayoutId>({
  key: "homeLayout",
  version: 1,
  schema: LayoutId,
  defaults: "manual",
});
