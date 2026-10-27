import { lazy } from "react";
import type { ToolDefinition } from "@/core/tool";

export const tool: ToolDefinition = {
  id: "ttk",
  name: "TTK Calculator",
  summary: "Shots and time to kill for any weapon, ammo, range and armor.",
  category: "combat",
  icon: "crosshair",
  component: lazy(() => import("./Tool")),
};
