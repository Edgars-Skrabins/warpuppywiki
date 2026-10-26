import { lazy } from "react";
import type { ToolDefinition } from "@/core/tool";

export const tool: ToolDefinition = {
  id: "map",
  name: "Map",
  summary: "Zoomable game maps with control zones, shops, spawns, buildings and line of sight.",
  category: "map",
  icon: "map",
  component: lazy(() => import("./Tool")),
};
