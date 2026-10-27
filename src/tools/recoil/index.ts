import { lazy } from "react";
import type { ToolDefinition } from "@/core/tool";

export const tool: ToolDefinition = {
  id: "recoil",
  name: "Recoil Viewer",
  summary: "See and compare weapon recoil patterns, with attachments.",
  category: "combat",
  icon: "chart",
  component: lazy(() => import("./Tool")),
};
