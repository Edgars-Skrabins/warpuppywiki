import { lazy } from "react";
import type { ToolDefinition } from "@/core/tool";

export const tool: ToolDefinition = {
  id: "ballistics",
  name: "Ballistics",
  summary: "Bullet drop, flight time and damage by range for every weapon and ammo.",
  category: "combat",
  icon: "target",
  status: "beta",
  component: lazy(() => import("./Tool")),
};
