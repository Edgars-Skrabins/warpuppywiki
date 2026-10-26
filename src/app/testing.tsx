import { lazy, type ComponentType } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { ToolCategory, ToolDefinition } from "@/core/tool";
import { renderWithData } from "@/core/data/testing";
import { buildRoutes } from "./router";

export function fakeTool(
  overrides: Partial<ToolDefinition> & { id: string; name: string; category: ToolCategory },
  component: ComponentType = () => <p>{overrides.name} content</p>,
): ToolDefinition {
  return {
    summary: `${overrides.name} summary`,
    icon: "list",
    component: lazy(() => Promise.resolve({ default: component })),
    ...overrides,
  };
}

export function renderApp(tools: readonly ToolDefinition[], path = "/", fixtures?: Record<string, unknown>) {
  const router = createMemoryRouter(buildRoutes(tools), { initialEntries: [path] });
  return { router, ...renderWithData(<RouterProvider router={router} />, { fixtures }) };
}
