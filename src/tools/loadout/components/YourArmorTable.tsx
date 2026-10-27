import { useMemo } from "react";
import { sameId } from "@/core/catalog";
import type { DistancePoint } from "@/core/damage";
import type { AmmoOption, PlayerWeapon } from "@/core/weapons";
import { ComboBox, DataTable, SegmentedControl, Select, type Column } from "@/ui";
import { slotItemId, type LethalityView, type Loadout } from "../model/loadout";
import { armorComparison, bulletWeapons, isModeled, type ArmorRow, type LethalityModel } from "../model/lethality";
import { buildTtkLink } from "../model/ttkLink";
import { ammoTypeLabel } from "../model/weaponSetup";
import { Hint } from "./Hint";
import { extraShotsText, pointText, RELOAD_HINT } from "./lethalityText";
import styles from "./Lethality.module.css";

const PLACEMENTS: { id: LethalityView["threatPlacement"]; label: string }[] = [
  { id: "upper-chest", label: "Upper chest" },
  { id: "head", label: "Head" },
];

function pointCell(point: DistancePoint) {
  return point.needsReload ? <Hint content={RELOAD_HINT}>{pointText(point)}</Hint> : pointText(point);
}

function ammoChoices(weapon: PlayerWeapon, model: LethalityModel): AmmoOption[] {
  const choices: AmmoOption[] = [];
  for (const option of model.index.ammoOptions(weapon).filter(isModeled)) {
    if (!choices.some((choice) => choice.ammoType === option.ammoType)) {
      choices.push(option);
    }
  }
  return choices;
}

export interface YourArmorTableProps {
  loadout: Loadout;
  model: LethalityModel;
  onViewChange: (changes: Partial<LethalityView>) => void;
}

export function YourArmorTable({ loadout, model, onViewChange }: YourArmorTableProps) {
  const view = loadout.view.lethality;
  const armorId = slotItemId(loadout, "armor");
  const helmetId = slotItemId(loadout, "helmet");
  const { threatWeaponId, threatAmmoType, threatPlacement } = view;
  const comparison = useMemo(
    () =>
      armorComparison(model, {
        armorId,
        helmetId,
        weaponId: threatWeaponId,
        ammoType: threatAmmoType,
        placement: threatPlacement,
      }),
    [model, armorId, helmetId, threatWeaponId, threatAmmoType, threatPlacement],
  );
  const weapons = useMemo(() => bulletWeapons(model.index), [model]);

  if (comparison === null) {
    return <p className={styles.muted}>No weapon in the game data can be used as a threat.</p>;
  }
  const { weapon, ammo, bodyArmor, helmet } = comparison;
  const worn = [bodyArmor?.name, helmet?.name].filter((name): name is string => !!name);

  const columns: Column<ArmorRow>[] = [
    { key: "distance", header: "Distance", value: (row) => row.distance, render: (row) => `${row.distance} m` },
    {
      key: "armored",
      header: "With your armor",
      align: "end",
      value: (row) => row.armored.stk,
      render: (row) => pointCell(row.armored),
    },
    {
      key: "unarmored",
      header: "No armor",
      align: "end",
      value: (row) => row.unarmored.stk,
      render: (row) => pointCell(row.unarmored),
    },
    {
      key: "difference",
      header: "Difference",
      align: "end",
      value: (row) => row.extraShots,
      render: (row) => extraShotsText(row.extraShots),
    },
    {
      key: "link",
      header: <span className={styles.visuallyHidden}>Link</span>,
      value: () => null,
      render: (row) => (
        <a
          className={styles.link}
          aria-label={`Open ${weapon.name} at ${row.distance} m in TTK Calculator`}
          href={buildTtkLink({
            weaponId: weapon.id,
            ammoType: ammo.ammoType,
            magazineId: null,
            placement: threatPlacement,
            bodyArmorId: bodyArmor?.id ?? null,
            helmetId: helmet?.id ?? null,
            distance: row.distance,
          })}
        >
          Open in TTK Calculator
        </a>
      ),
    },
  ];

  return (
    <div className={styles.tab}>
      <div className={styles.controls}>
        <ComboBox
          label="Threat weapon"
          items={weapons}
          getKey={(candidate) => candidate.id}
          getLabel={(candidate) => candidate.name}
          getGroup={(candidate) => candidate.archetype?.label ?? "Other"}
          selectedKey={weapon.id}
          onSelectionChange={(key) => {
            if (key !== null) onViewChange({ threatWeaponId: key, threatAmmoType: null });
          }}
          className={styles.wideControl}
        />
        <Select
          label="Threat ammo"
          items={ammoChoices(weapon, model)}
          getKey={(option) => option.ammoType}
          getLabel={(option) => ammoTypeLabel(option.ammoType)}
          selectedKey={ammo.ammoType}
          onSelectionChange={(key) => {
            if (key !== null) onViewChange({ threatAmmoType: key });
          }}
          className={styles.control}
        />
        <div className={styles.field}>
          <span className={styles.fieldLabel} aria-hidden="true">
            Shot placement
          </span>
          <SegmentedControl
            aria-label="Threat shot placement"
            size="sm"
            options={PLACEMENTS}
            value={threatPlacement}
            onChange={(placement) => onViewChange({ threatPlacement: placement })}
          />
        </div>
      </div>
      <p className={styles.muted}>
        {worn.length === 0 ? "You wear no body armor or helmet." : `You wear ${worn.join(" and ")}.`}
        {sameId(threatWeaponId, weapon.id) ? "" : ` ${weapon.name} is used as the threat.`}
      </p>
      <DataTable
        aria-label="Your armor"
        columns={columns}
        rows={comparison.rows}
        getRowKey={(row) => String(row.distance)}
        emptyText="No results"
      />
    </div>
  );
}
