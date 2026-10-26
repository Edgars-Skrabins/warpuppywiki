import type { ToolCategory, ToolDefinition } from "@/core/tool";
import { CATEGORIES } from "./categories";

export interface ToolGroup {
  id: ToolCategory;
  label: string;
  tools: ToolDefinition[];
}

export function groupTools(list: readonly ToolDefinition[]): ToolGroup[] {
  return CATEGORIES.map((category) => ({
    ...category,
    tools: list.filter((tool) => tool.category === category.id),
  })).filter((group) => group.tools.length > 0);
}

export function filterTools(list: readonly ToolDefinition[], query: string): ToolDefinition[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") {
    return [...list];
  }
  return list.filter((tool) => `${tool.name} ${tool.summary}`.toLowerCase().includes(needle));
}
