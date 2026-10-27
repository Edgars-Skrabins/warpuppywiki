import { sameId, type Catalog } from "@/core/catalog";
import type { Armor, EquipmentFile } from "@/core/data";
import { HIT_LOCATIONS } from "@/core/damage";
import { attributeInfo, collect, combine, type BetterWhen, type ModifierSource } from "@/core/modifiers";
import { effectiveStats } from "@/core/weapons";
import { slotItemId, weaponSetupOf, type LethalityView, type Loadout, type SlotId } from "../model/loadout";
import {
  armorComparison,
  LETHALITY_DISTANCES,
  LETHALITY_SLOTS,
  lethalityTarget,
  loadoutAmmo,
  weaponRow,
  type LethalityModel,
} from "../model/lethality";
import { slotDefinition } from "../model/slots";
import { costSummary, kitStatSources, unlockSummary, weightSummary } from "../model/totals";
import { fittedAttachments, setupSummaryText } from "../model/weaponSetup";

export type CompareFormat = "cash" | "weight" | "seconds" | "multiplier" | "number" | "percent" | "distance" | "text";

export interface CompareValue {
  value: number | null;
  text: string | null;
}

export interface CompareRow {
  key: string;
  label: string;
  a: CompareValue;
  b: CompareValue;
  delta: number | null;
  betterWhen: BetterWhen;
  format: CompareFormat;
}

export interface CompareSectionData {
  id: "cost" | "weight" | "protection" | "weapons" | "lethality";
  title: string;
  rows: CompareRow[];
}

export interface CompareTarget {
  targetArmor: number;
  targetHelmet: number;
  placement: LethalityView["placement"];
}

export interface CompareThreat {
  weaponId: string;
  ammoType: string | null;
  placement: LethalityView["threatPlacement"];
}

export interface CompareModel extends LethalityModel {
  catalog: Catalog;
}

const NONE: CompareValue = { value: null, text: null };

function num(value: number | null | undefined): CompareValue {
  return { value: value ?? null, text: null };
}

function text(value: string | null | undefined): CompareValue {
  return { value: null, text: value ?? null };
}

function row(
  key: string,
  label: string,
  a: CompareValue,
  b: CompareValue,
  betterWhen: BetterWhen,
  format: CompareFormat,
): CompareRow {
  return {
    key,
    label,
    a,
    b,
    delta: a.value === null || b.value === null ? null : b.value - a.value,
    betterWhen,
    format,
  };
}

function costRows(a: Loadout, b: Loadout, model: CompareModel): CompareRow[] {
  const costA = costSummary(a, model.catalog);
  const costB = costSummary(b, model.catalog);
  return [
    row("total", "Total cost", num(costA.total), num(costB.total), "lower", "cash"),
    ...costA.sections.map((section) =>
      row(
        section.id,
        section.label,
        num(section.total),
        num(costB.sections.find((other) => other.id === section.id)?.total),
        "lower",
        "cash",
      ),
    ),
    row(
      "unlock",
      "Unlock cash",
      num(unlockSummary(a, model.catalog).totalCost),
      num(unlockSummary(b, model.catalog).totalCost),
      "lower",
      "cash",
    ),
  ];
}

function effectFormat(unit: ReturnType<typeof attributeInfo>["unit"]): CompareFormat {
  if (unit === "meters") return "distance";
  if (unit === "points") return "number";
  return "multiplier";
}

function effectValue(sources: readonly ModifierSource[], attribute: string): number {
  const info = attributeInfo(attribute);
  return combine(info.unit === "multiplier" ? 1 : 0, collect(sources, attribute)).value;
}

function weightRows(a: Loadout, b: Loadout, model: CompareModel): CompareRow[] {
  const weightA = weightSummary(a, model.catalog, model.equipment);
  const weightB = weightSummary(b, model.catalog, model.equipment);
  const sourcesA = kitStatSources(a, model.catalog, model.equipment);
  const sourcesB = kitStatSources(b, model.catalog, model.equipment);
  const attributes: string[] = [];
  for (const source of [...sourcesA, ...sourcesB]) {
    for (const modifier of source.modifiers) {
      if (!attributes.some((attribute) => sameId(attribute, modifier.attribute))) {
        attributes.push(modifier.attribute);
      }
    }
  }
  return [
    row("total", "Total weight", num(weightA.totalKg), num(weightB.totalKg), "lower", "weight"),
    row("class", "Weight class", text(weightA.weightClass?.name), text(weightB.weightClass?.name), "neutral", "text"),
    ...attributes.map((attribute) => {
      const info = attributeInfo(attribute);
      return row(
        attribute,
        info.label,
        num(effectValue(sourcesA, attribute)),
        num(effectValue(sourcesB, attribute)),
        info.betterWhen,
        effectFormat(info.unit),
      );
    }),
  ];
}

function wornArmor(loadout: Loadout, equipment: EquipmentFile, slot: SlotId): Armor | null {
  const itemId = slotItemId(loadout, slot);
  return itemId === null ? null : (equipment.armor.find((armor) => sameId(armor.id, itemId)) ?? null);
}

function zonesText(armor: Armor | null): string | null {
  if (armor === null) {
    return null;
  }
  const labels = armor.coveredLocations.map(
    (location) => HIT_LOCATIONS.find((info) => sameId(info.location, location))?.label ?? location,
  );
  return labels.length === 0 ? "None" : labels.join(", ");
}

function reduction(armor: Armor | null): CompareValue {
  const first = armor?.stages[0];
  return num(first === undefined ? null : first.damageReduction / 100);
}

function protectionRows(a: Loadout, b: Loadout, model: CompareModel): CompareRow[] {
  return (["armor", "helmet"] as const).flatMap((slot) => {
    const label = slotDefinition(slot).label;
    const armorA = wornArmor(a, model.equipment, slot);
    const armorB = wornArmor(b, model.equipment, slot);
    const nameOf = (loadout: Loadout) => {
      const itemId = slotItemId(loadout, slot);
      return itemId === null ? null : (model.catalog.item(itemId)?.name ?? itemId);
    };
    return [
      row(`${slot}-name`, label, text(nameOf(a)), text(nameOf(b)), "neutral", "text"),
      row(
        `${slot}-durability`,
        `${label} durability`,
        num(armorA?.durability),
        num(armorB?.durability),
        "higher",
        "number",
      ),
      row(
        `${slot}-reduction`,
        `${label} damage reduction (new)`,
        reduction(armorA),
        reduction(armorB),
        "higher",
        "percent",
      ),
      row(`${slot}-zones`, `${label} covers`, text(zonesText(armorA)), text(zonesText(armorB)), "neutral", "text"),
    ];
  });
}

function weaponRows(a: Loadout, b: Loadout, model: CompareModel): CompareRow[] {
  const sourcesA = kitStatSources(a, model.catalog, model.equipment);
  const sourcesB = kitStatSources(b, model.catalog, model.equipment);
  return LETHALITY_SLOTS.flatMap((slot) => {
    const label = slotDefinition(slot).label;
    const side = (loadout: Loadout, sources: readonly ModifierSource[]) => {
      const setup = weaponSetupOf(loadout, slot);
      const weapon = setup === null ? undefined : model.index.weapon(setup.itemId);
      if (setup === null || weapon === undefined) {
        const itemId = slotItemId(loadout, slot);
        return {
          name: itemId === null ? null : (model.catalog.item(itemId)?.name ?? itemId),
          setup: null,
          stats: null,
          ammo: null,
        };
      }
      const choice = loadoutAmmo(setup, model.index.ammoOptions(weapon));
      return {
        name: weapon.name,
        setup: setupSummaryText(setup, model.index, model.catalog),
        stats: effectiveStats(weapon.stats, fittedAttachments(weapon, setup, model.index), sources),
        ammo: choice === null ? null : choice.assumed ? "None bought" : choice.ammo.item.name,
      };
    };
    const sideA = side(a, sourcesA);
    const sideB = side(b, sourcesB);
    if (sideA.name === null && sideB.name === null) {
      return [];
    }
    return [
      row(`${slot}-weapon`, label, text(sideA.name), text(sideB.name), "neutral", "text"),
      row(`${slot}-setup`, `${label} setup`, text(sideA.setup), text(sideB.setup), "neutral", "text"),
      row(`${slot}-ammo`, `${label} ammo`, text(sideA.ammo), text(sideB.ammo), "neutral", "text"),
      row(
        `${slot}-ads`,
        `${label} ADS time`,
        num(sideA.stats?.adsTime?.value),
        num(sideB.stats?.adsTime?.value),
        "lower",
        "seconds",
      ),
      row(
        `${slot}-vertical`,
        `${label} vertical recoil`,
        num(sideA.stats?.verticalRecoil.value),
        num(sideB.stats?.verticalRecoil.value),
        "lower",
        "multiplier",
      ),
      row(
        `${slot}-horizontal`,
        `${label} horizontal recoil`,
        num(sideA.stats?.horizontalRecoil.value),
        num(sideB.stats?.horizontalRecoil.value),
        "lower",
        "multiplier",
      ),
    ];
  });
}

function lethalityRows(
  a: Loadout,
  b: Loadout,
  model: CompareModel,
  target: CompareTarget,
  threat: CompareThreat,
): CompareRow[] {
  const shared = lethalityTarget(model, target.targetArmor, target.targetHelmet);
  const primary = (loadout: Loadout) => {
    const setup = weaponSetupOf(loadout, "primary");
    const result = setup === null ? null : weaponRow("primary", setup, model, shared, target.placement);
    return result !== null && result.modeled ? result : null;
  };
  const survival = (loadout: Loadout) =>
    armorComparison(model, {
      armorId: slotItemId(loadout, "armor"),
      helmetId: slotItemId(loadout, "helmet"),
      weaponId: threat.weaponId,
      ammoType: threat.ammoType,
      placement: threat.placement,
    });
  const primaryA = primary(a);
  const primaryB = primary(b);
  const survivalA = survival(a);
  const survivalB = survival(b);
  return [
    ...LETHALITY_DISTANCES.flatMap((distance, position) => [
      row(
        `stk-${distance}`,
        `Primary shots to kill at ${distance} m`,
        num(primaryA?.points[position]?.stk),
        num(primaryB?.points[position]?.stk),
        "lower",
        "number",
      ),
      row(
        `ttk-${distance}`,
        `Primary time to kill at ${distance} m`,
        primaryA?.points[position]?.needsReload ? NONE : num(primaryA?.points[position]?.ttk),
        primaryB?.points[position]?.needsReload ? NONE : num(primaryB?.points[position]?.ttk),
        "lower",
        "seconds",
      ),
    ]),
    ...LETHALITY_DISTANCES.map((distance, position) =>
      row(
        `survival-${distance}`,
        `Shots to kill you at ${distance} m`,
        num(survivalA?.rows[position]?.armored.stk),
        num(survivalB?.rows[position]?.armored.stk),
        "higher",
        "number",
      ),
    ),
  ];
}

export function compareLoadouts(
  a: Loadout,
  b: Loadout,
  model: CompareModel,
  target: CompareTarget,
  threat: CompareThreat,
): CompareSectionData[] {
  return [
    { id: "cost", title: "Cost", rows: costRows(a, b, model) },
    { id: "weight", title: "Weight", rows: weightRows(a, b, model) },
    { id: "protection", title: "Protection", rows: protectionRows(a, b, model) },
    { id: "weapons", title: "Weapons", rows: weaponRows(a, b, model) },
    { id: "lethality", title: "Lethality", rows: lethalityRows(a, b, model, target, threat) },
  ];
}

export function textDifference(rowData: CompareRow): "same" | "different" | null {
  if (rowData.a.text === null || rowData.b.text === null) {
    return null;
  }
  return rowData.a.text === rowData.b.text ? "same" : "different";
}
