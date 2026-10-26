import { lazy } from "react";
import { describe, expect, it } from "vitest";
import type { ToolCategory, ToolDefinition } from "@/core/tool";
import { isIconName } from "@/ui";
import { CATEGORIES } from "./categories";
import { sortTools, toolModules, tools } from "./toolRegistry";

const discovered = Object.entries(toolModules).map(([path, module]) => ({
  folder: path.split("/").at(-2),
  tool: module.tool,
}));

function fakeTool(id: string, name: string, category: ToolCategory): ToolDefinition {
  return {
    id,
    name,
    summary: "",
    category,
    icon: "list",
    component: lazy(() => Promise.resolve({ default: () => null })),
  };
}

describe("tool registry", () => {
  it("lists every discovered tool", () => {
    expect(tools).toHaveLength(discovered.length);
  });

  it("has unique ids", () => {
    const ids = tools.map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(discovered)("$folder is a valid tool", ({ folder, tool }) => {
    expect(tool.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(tool.id).toBe(folder);
    expect(CATEGORIES.map((entry) => entry.id)).toContain(tool.category);
    expect(isIconName(tool.icon)).toBe(true);
  });
});

describe("sortTools", () => {
  it("orders by category, then by name", () => {
    const sorted = sortTools([
      fakeTool("patch-diff", "Patch diff", "updates"),
      fakeTool("ttk", "TTK calculator", "combat"),
      fakeTool("map", "Map", "map"),
      fakeTool("arsenal", "Arsenal", "combat"),
      fakeTool("loot", "Loot tables", "reference"),
    ]);

    expect(sorted.map((tool) => tool.id)).toEqual(["arsenal", "ttk", "map", "loot", "patch-diff"]);
  });

  it("does not mutate its input", () => {
    const input = [fakeTool("b", "B", "map"), fakeTool("a", "A", "combat")];
    sortTools(input);
    expect(input.map((tool) => tool.id)).toEqual(["b", "a"]);
  });
});
