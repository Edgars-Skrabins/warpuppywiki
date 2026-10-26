import type { ToolDefinition } from "@/core/tool";
import { isIconName, type IconName } from "@/ui";

export function toolIcon(tool: ToolDefinition): IconName {
  return isIconName(tool.icon) ? tool.icon : "box";
}
