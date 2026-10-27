import { stripPrefix } from "@/core/catalog";
import type { Buildable } from "@/core/data";
import { placementLabel, splitWords } from "./placementLabels";

export interface Footprint {
  width: number;
  depth: number;
  height: number;
}

export interface BuildableRow {
  id: string;
  name: string;
  icon: string | null;
  cost: number;
  health: number;
  healthPerSupply: number | null;
  repairSpeed: number | null;
  footprint: Footprint | null;
  volume: number | null;
  tools: string[];
  placement: string[];
  maxStack: number | null;
  damageEntity: string | null;
}

export function buildableName(buildable: Buildable): string {
  return buildable.name ?? splitWords(stripPrefix(buildable.id, "Id.Buildable"));
}

export function toolLabel(tool: string): string {
  return splitWords(tool);
}

function footprintOf(size: Buildable["size"]): Footprint | null {
  if (!size) return null;
  const [width, depth, height] = size;
  return { width, depth, height };
}

export function buildableRow(buildable: Buildable): BuildableRow {
  const footprint = footprintOf(buildable.size);
  return {
    id: buildable.id,
    name: buildableName(buildable),
    icon: buildable.icon ?? null,
    cost: buildable.cost,
    health: buildable.maxHealth,
    healthPerSupply: buildable.cost > 0 ? buildable.maxHealth / buildable.cost : null,
    repairSpeed: buildable.repairSpeedMultiplier ?? null,
    footprint,
    volume: footprint ? footprint.width * footprint.depth * footprint.height : null,
    tools: buildable.tools.map(toolLabel),
    placement: buildable.placementRules.map(placementLabel),
    maxStack: buildable.maxStack ?? null,
    damageEntity: buildable.damageEntity ?? null,
  };
}

export function buildableRows(buildables: readonly Buildable[]): BuildableRow[] {
  return buildables.map(buildableRow);
}
