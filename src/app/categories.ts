import type { ToolCategory } from "@/core/tool";

export const CATEGORIES: readonly { id: ToolCategory; label: string }[] = [
  { id: "combat", label: "Combat" },
  { id: "map", label: "Map" },
  { id: "progression", label: "Progression" },
  { id: "reference", label: "Reference" },
  { id: "updates", label: "Updates" },
];

export function categoryLabel(category: ToolCategory): string {
  return CATEGORIES.find((entry) => entry.id === category)?.label ?? category;
}
