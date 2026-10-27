import { lazy } from "react";
import type { ToolDefinition } from "@/core/tool";

export const tool: ToolDefinition = {
  id: "armor",
  name: "Armor & Weight",
  summary: "Compare armor and helmets, see what beats them and what weight costs you.",
  category: "reference",
  icon: "shield",
  component: lazy(() => import("./Tool")),
};
