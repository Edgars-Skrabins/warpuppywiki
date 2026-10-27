export const ICON_NAMES = [
  "crosshair",
  "backpack",
  "map",
  "diff",
  "chart",
  "target",
  "truck",
  "shield",
  "tree",
  "box",
  "coins",
  "list",
  "hammer",
  "scroll",
  "store",
  "garage",
  "flag",
  "fuel",
  "tent",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export function isIconName(value: string): value is IconName {
  return (ICON_NAMES as readonly string[]).includes(value);
}
