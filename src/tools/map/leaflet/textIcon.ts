import { divIcon, type DivIcon } from "leaflet";

export function textIcon(text: string, className?: string, textClassName?: string): DivIcon {
  const span = document.createElement("span");
  span.className = textClassName ?? "";
  span.textContent = text;
  return divIcon({ className, html: span, iconSize: [0, 0] });
}
