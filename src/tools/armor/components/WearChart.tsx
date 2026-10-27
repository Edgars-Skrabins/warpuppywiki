import { useMemo } from "react";
import type { DamageFile } from "@/core/data";
import { AMMO_TYPE_LABELS, type PlayerWeapon, type WeaponIndex } from "@/core/weapons";
import { ComboBox, Grid, LineChartCard, Select, Stack, formatNumber, type ReferenceLineSpec } from "@/ui";
import { bulletAmmo } from "../logic/ammoMatrix";
import type { ArmorRow } from "../logic/armorRows";
import { MAX_WEAR_HITS, wearSeries } from "../logic/wearSeries";
import { ModelNotes } from "./ModelNotes";
import styles from "./WearChart.module.css";

export interface WearChartProps {
  damage: DamageFile;
  index: WeaponIndex;
  armorRows: readonly ArmorRow[];
  armor: ArmorRow;
  onArmorChange: (id: string) => void;
  weapons: readonly PlayerWeapon[];
  weapon: PlayerWeapon;
  onWeaponChange: (id: string) => void;
  ammoId: string | null;
  onAmmoChange: (id: string) => void;
  notes: readonly string[];
}

export function WearChart({
  damage,
  index,
  armorRows,
  armor,
  onArmorChange,
  weapons,
  weapon,
  onWeaponChange,
  ammoId,
  onAmmoChange,
  notes,
}: WearChartProps) {
  const ammoOptions = useMemo(() => bulletAmmo(index, weapon), [index, weapon]);
  const ammo = ammoOptions.find((option) => option.item.id.toLowerCase() === ammoId?.toLowerCase()) ?? ammoOptions[0];
  const series = useMemo(
    () => (ammo === undefined ? null : wearSeries({ damage, weapon, ammo, armor: armor.armor })),
    [damage, weapon, ammo, armor],
  );

  const referenceLines = useMemo<ReferenceLineSpec[]>(
    () => [
      ...(series?.stageChanges ?? []).map((change) => ({
        axis: "x" as const,
        value: change.hit,
        label: `Stage ${change.stage + 1}`,
      })),
      ...(series?.spentAt ? [{ axis: "x" as const, value: series.spentAt, label: "Spent" }] : []),
    ],
    [series],
  );

  const points = series?.points ?? [];
  const summary =
    series === null
      ? "This weapon has no bullet ammo."
      : series.spentAt === null
        ? `Still holding after ${MAX_WEAR_HITS} hits.`
        : `Spent after ${formatNumber(series.spentAt)} hits to the upper chest.`;

  return (
    <Stack gap={4}>
      <div className={styles.controls}>
        <Select
          label="Armor"
          items={armorRows}
          getKey={(row) => row.id}
          getLabel={(row) => row.name}
          selectedKey={armor.id}
          onSelectionChange={(key) => key !== null && onArmorChange(key)}
        />
        <ComboBox
          label="Weapon"
          items={weapons}
          getKey={(entry) => entry.id}
          getLabel={(entry) => entry.name}
          getGroup={(entry) => entry.archetype?.label ?? "Other"}
          selectedKey={weapon.id}
          onSelectionChange={(key) => key !== null && onWeaponChange(key)}
        />
        <Select
          label="Ammo"
          items={ammoOptions}
          getKey={(option) => option.item.id}
          getLabel={(option) => `${option.item.name} (${AMMO_TYPE_LABELS[option.ammoType]})`}
          selectedKey={ammo?.item.id ?? null}
          onSelectionChange={(key) => key !== null && onAmmoChange(key)}
        />
      </div>
      <p className={styles.summary}>{summary}</p>
      <Grid minColumnWidth={320}>
        <LineChartCard
          title="Armor durability"
          subtitle="After each hit"
          series={[
            { key: "durability", label: "Durability", points: points.map((p) => ({ x: p.hit, y: p.durability })) },
          ]}
          xLabel="Hit"
          yLabel="Durability"
          yDomain={[0, armor.durability ?? "auto"]}
          referenceLines={referenceLines}
        />
        <LineChartCard
          title="Health damage per hit"
          subtitle="Through the armor"
          series={[
            { key: "health", label: "Health damage", points: points.map((p) => ({ x: p.hit, y: p.healthDamage })) },
          ]}
          xLabel="Hit"
          yLabel="Damage"
          yDomain={[0, "auto"]}
          referenceLines={referenceLines}
        />
      </Grid>
      <ModelNotes notes={notes} />
    </Stack>
  );
}
