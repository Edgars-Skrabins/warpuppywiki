import type { ToolDefinition } from "@/core/tool";
import type { ToolGroup } from "../../groupTools";

export interface HomeLayoutProps {
  tools: readonly ToolDefinition[];
  groups: readonly ToolGroup[];
}
