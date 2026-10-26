import { lazy } from "react";
import type { ToolDefinition } from "@/core/tool";

export const tool: ToolDefinition = {
  id: "loadout",
  name: "Loadout Builder",
  summary: "Build a kit, see its cost, weight class and what it takes to unlock.",
  category: "combat",
  icon: "backpack",
  component: lazy(() => import("./Tool")),
};
