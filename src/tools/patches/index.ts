import { lazy } from "react";
import type { ToolDefinition } from "@/core/tool";

export const tool: ToolDefinition = {
  id: "patches",
  name: "Patch Diff",
  summary: "What changed between game builds: weapons, prices, unlocks, damage rules, maps.",
  category: "updates",
  icon: "diff",
  component: lazy(() => import("./Tool")),
};
