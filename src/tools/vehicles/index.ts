import { lazy } from "react";
import type { ToolDefinition } from "@/core/tool";

export const tool: ToolDefinition = {
  id: "vehicles",
  name: "Vehicles",
  summary: "Compare every vehicle's price, speed, fuel, health, weapons and weak spots.",
  category: "reference",
  icon: "truck",
  component: lazy(() => import("./Tool")),
};
