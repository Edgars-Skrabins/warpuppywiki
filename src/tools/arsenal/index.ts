import { lazy } from "react";
import type { ToolDefinition } from "@/core/tool";

export const tool: ToolDefinition = {
  id: "arsenal",
  name: "Arsenal",
  summary: "Every weapon's stats, ammo, attachments, price and unlock.",
  category: "reference",
  icon: "target",
  component: lazy(() => import("./Tool")),
};
