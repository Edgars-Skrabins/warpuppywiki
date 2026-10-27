import { lazy } from "react";
import type { ToolDefinition } from "@/core/tool";

export const tool: ToolDefinition = {
  id: "damage-rules",
  name: "Damage Rules",
  summary: "Browse and filter the game's raw damage rules and multipliers.",
  category: "reference",
  icon: "scroll",
  status: "beta",
  component: lazy(() => import("./Tool")),
};
