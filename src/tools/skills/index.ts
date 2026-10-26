import { lazy } from "react";
import type { ToolDefinition } from "@/core/tool";

export const tool: ToolDefinition = {
  id: "skills",
  name: "Skill Trees",
  summary: "Every role's skill tree with descriptions and per-level effects.",
  category: "progression",
  icon: "tree",
  component: lazy(() => import("./Tool")),
};
