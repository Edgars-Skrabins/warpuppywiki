import { lazy } from "react";
import type { ToolDefinition } from "@/core/tool";

export const tool: ToolDefinition = {
  id: "progression",
  name: "Progression Planner",
  summary: "XP and cash you still need for the unlocks you want.",
  category: "progression",
  icon: "coins",
  component: lazy(() => import("./Tool")),
};
