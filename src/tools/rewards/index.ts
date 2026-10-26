import { lazy } from "react";
import type { ToolDefinition } from "@/core/tool";

export const tool: ToolDefinition = {
  id: "rewards",
  name: "Reward Calculator",
  summary: "Cash and XP for every in-match event, from the game's own formulas.",
  category: "progression",
  icon: "coins",
  component: lazy(() => import("./Tool")),
};
