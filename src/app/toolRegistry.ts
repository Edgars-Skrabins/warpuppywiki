import type { ToolDefinition } from "@/core/tool";
import { CATEGORIES } from "./categories";

export const toolModules = import.meta.glob<{ tool: ToolDefinition }>("../tools/*/index.ts", { eager: true });

function categoryIndex(tool: ToolDefinition): number {
  return CATEGORIES.findIndex((entry) => entry.id === tool.category);
}

export function sortTools(list: readonly ToolDefinition[]): ToolDefinition[] {
  return [...list].sort((a, b) => categoryIndex(a) - categoryIndex(b) || a.name.localeCompare(b.name, "en"));
}

export const tools: readonly ToolDefinition[] = sortTools(Object.values(toolModules).map((module) => module.tool));
