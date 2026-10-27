import { useMemo } from "react";
import type { Target } from "@/core/damage";
import { DataTable, SegmentedControl, Select, type Column } from "@/ui";
import { ARMOR_LEVELS, weaponSetupOf, type LethalityView, type Loadout, type SlotId } from "../model/loadout";
import {
  armorForLevel,
  LETHALITY_DISTANCES,
  lethalityTarget,
  weaponRow,
  type ArmorSlotName,
  type LethalityModel,
  type WeaponRow,
} from "../model/lethality";
import { buildTtkLink } from "../model/ttkLink";
import { ammoTypeLabel } from "../model/weaponSetup";
import { Hint } from "./Hint";
import { pointText, RELOAD_HINT } from "./lethalityText";
import styles from "./Lethality.module.css";

const PLACEMENTS: { id: LethalityView["placement"]; label: string }[] = [
  { id: "upper-chest", label: "Upper chest" },
  { id: "head", label: "Head" },
  { id: "mixed", label: "Mixed" },
];

interface LevelChoice {
  key: string;
  level: number;
  label: string;
}

function levelChoices(model: LethalityModel, slot: ArmorSlotName): LevelChoice[] {
  return ARMOR_LEVELS.flatMap((level): LevelChoice[] => {
    if (level === 0) {
      return [{ key: "0", level, label: "None" }];
    }
    const armor = armorForLevel(model.equipment, slot, level);
    return armor === null ? [] : [{ key: String(level), level, label: armor.name ?? `Level ${level}` }];
  });
}

function useWeaponRow(
  loadout: Loadout,
  slot: SlotId,
  model: LethalityModel,
  target: Target,
  placement: LethalityView["placement"],
): WeaponRow | null {
  const setup = weaponSetupOf(loadout, slot);
  return useMemo(
    () => (setup === null ? null : weaponRow(slot, setup, model, target, placement)),
    [setup, slot, model, target, placement],
  );
}

function distanceColumn(distance: number, position: number): Column<WeaponRow> {
  return {
    key: `d${distance}`,
    header: `${distance} m`,
    align: "end",
    value: (row) => row.points[position]?.stk ?? null,
    render: (row) => {
      if (!row.modeled) {
        return <span className={styles.muted}>Not modeled</span>;
      }
      const point = row.points[position];
      if (point === undefined) {
        return "—";
      }
      return point.needsReload ? <Hint content={RELOAD_HINT}>{pointText(point)}</Hint> : pointText(point);
    },
  };
}

export interface YourWeaponsTableProps {
  loadout: Loadout;
  model: LethalityModel;
  onViewChange: (changes: Partial<LethalityView>) => void;
}

export function YourWeaponsTable({ loadout, model, onViewChange }: YourWeaponsTableProps) {
  const view = loadout.view.lethality;
  const target = useMemo(
    () => lethalityTarget(model, view.targetArmor, view.targetHelmet),
    [model, view.targetArmor, view.targetHelmet],
  );
  const primary = useWeaponRow(loadout, "primary", model, target, view.placement);
  const sidearm = useWeaponRow(loadout, "sidearm", model, target, view.placement);
  const specialist = useWeaponRow(loadout, "specialist", model, target, view.placement);
  const rows = [primary, sidearm, specialist].filter((row): row is WeaponRow => row !== null);
  const bodyChoices = levelChoices(model, "Armor");
  const helmetChoices = levelChoices(model, "Helmet");

  const columns: Column<WeaponRow>[] = [
    {
      key: "weapon",
      header: "Weapon",
      value: (row) => row.weapon.name,
      render: (row) => (
        <span className={styles.stacked}>
          <span>{row.weapon.name}</span>
          <span className={styles.muted}>{row.slotLabel}</span>
        </span>
      ),
    },
    {
      key: "ammo",
      header: "Ammo",
      value: (row) => ammoTypeLabel(row.ammo.ammoType),
      render: (row) => (
        <span className={styles.stacked}>
          <span>{row.ammo.item.name}</span>
          {row.assumedAmmo && <span className={styles.muted}>No ammo bought, assuming FMJ</span>}
        </span>
      ),
    },
    ...LETHALITY_DISTANCES.map(distanceColumn),
    {
      key: "link",
      header: <span className={styles.visuallyHidden}>Link</span>,
      value: () => null,
      render: (row) =>
        row.modeled ? (
          <a
            className={styles.link}
            aria-label={`Open ${row.weapon.name} in TTK Calculator`}
            href={buildTtkLink({
              weaponId: row.weapon.id,
              ammoType: row.ammo.ammoType,
              magazineId: row.magazineId,
              placement: view.placement,
              bodyArmorId: armorForLevel(model.equipment, "Armor", view.targetArmor)?.id ?? null,
              helmetId: armorForLevel(model.equipment, "Helmet", view.targetHelmet)?.id ?? null,
            })}
          >
            Open in TTK Calculator
          </a>
        ) : null,
    },
  ];

  return (
    <div className={styles.tab}>
      <div className={styles.controls}>
        <Select
          label="Target body armor"
          items={bodyChoices}
          getKey={(choice) => choice.key}
          getLabel={(choice) => choice.label}
          selectedKey={String(view.targetArmor)}
          onSelectionChange={(_key, choice) => {
            if (choice !== null) onViewChange({ targetArmor: choice.level });
          }}
          className={styles.control}
        />
        <Select
          label="Target helmet"
          items={helmetChoices}
          getKey={(choice) => choice.key}
          getLabel={(choice) => choice.label}
          selectedKey={String(view.targetHelmet)}
          onSelectionChange={(_key, choice) => {
            if (choice !== null) onViewChange({ targetHelmet: choice.level });
          }}
          className={styles.control}
        />
        <div className={styles.field}>
          <span className={styles.fieldLabel} aria-hidden="true">
            Shot placement
          </span>
          <SegmentedControl
            aria-label="Shot placement"
            size="sm"
            options={PLACEMENTS}
            value={view.placement}
            onChange={(placement) => onViewChange({ placement })}
          />
        </div>
      </div>
      <DataTable
        aria-label="Your weapons"
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.slot}
        emptyText="Add a primary, sidearm or specialist weapon that fires ammunition."
      />
    </div>
  );
}
