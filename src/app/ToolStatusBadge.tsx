import type { ToolDefinition } from "@/core/tool";
import { Badge } from "@/ui";

export function ToolStatusBadge({ status }: { status: ToolDefinition["status"] }) {
  if (status === "beta") return <Badge tone="tag">Beta</Badge>;
  if (status === "unreleased") return <Badge tone="warning">Not in game yet</Badge>;
  return null;
}
