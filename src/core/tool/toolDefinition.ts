import type { ComponentType, LazyExoticComponent } from "react";

export type ToolCategory = "combat" | "map" | "progression" | "reference" | "updates";

export interface ToolDefinition {
  id: string;
  name: string;
  summary: string;
  category: ToolCategory;
  icon: string;
  status?: "beta";
  component: LazyExoticComponent<ComponentType>;
}
