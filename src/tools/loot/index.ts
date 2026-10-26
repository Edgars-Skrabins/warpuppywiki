import type { ToolDefinition } from "@/core/tool";
import { lazy } from "react";

export const tool: ToolDefinition = {
  id: "loot",
  name: "Loot Tables",
  summary: "What towers and lootables can spawn, and how likely each item is.",
  category: "reference",
  icon: "list",
  component: lazy(() => import("./Tool")),
};
