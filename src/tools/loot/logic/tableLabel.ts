import { sameId } from "@/core/catalog";

export const OTHER_TABLE_IDS = ["Test", "PreLobby"] as const;

function splitWords(part: string): string {
  return part.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}

export function tableLabel(id: string): string {
  return id.split(".").map(splitWords).join(" · ");
}

export function isOtherTable(id: string): boolean {
  return OTHER_TABLE_IDS.some((other) => sameId(other, id));
}
