import { lazy } from "react";
import type { ToolDefinition } from "@/core/tool";

export const tool: ToolDefinition = {
  id: "items",
  name: "Item Browser",
  summary: "Search every item: price, unlock, size, weight and description.",
  category: "reference",
  icon: "box",
  component: lazy(() => import("./Tool")),
};
