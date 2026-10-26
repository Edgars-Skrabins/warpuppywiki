import { createHashRouter, type RouteObject } from "react-router";
import type { ToolDefinition } from "@/core/tool";
import { AppLayout } from "./layout/AppLayout";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ToolPage } from "./pages/ToolPage";
import { tools } from "./toolRegistry";

export function buildRoutes(list: readonly ToolDefinition[]): RouteObject[] {
  return [
    {
      path: "/",
      element: <AppLayout tools={list} />,
      children: [
        { index: true, element: <HomePage tools={list} /> },
        ...list.map((tool) => ({ path: tool.id, element: <ToolPage tool={tool} /> })),
        { path: "*", element: <NotFoundPage /> },
      ],
    },
  ];
}

export function createAppRouter() {
  return createHashRouter(buildRoutes(tools));
}
