import { lazy } from "react";
import type { ToolDefinition } from "@/core/tool";

export const tool: ToolDefinition = {
  id: "buildables",
  name: "Buildables",
  summary: "Fortifications: cost, health, size, tools, placement and what breaks them.",
  category: "reference",
  icon: "hammer",
  component: lazy(() => import("./Tool")),
};
