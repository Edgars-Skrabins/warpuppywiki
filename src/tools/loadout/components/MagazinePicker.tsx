import { sameId, type Catalog } from "@/core/catalog";
import type { MagazineOption } from "@/core/weapons";
import { formatCash, formatWeight, NumberField, SegmentedControl, Select } from "@/ui";
import { MAX_MAGAZINES, type WeaponSetup } from "../model/loadout";
import { ammoTypeLabel, loadedTypes, loadedVariation, selectMagazine } from "../model/weaponSetup";
import styles from "./SetupPickers.module.css";

type Magazine = NonNullable<WeaponSetup["magazine"]>;

export interface MagazinePickerProps {
  options: readonly MagazineOption[];
  value: WeaponSetup["magazine"];
  catalog: Catalog;
  onChange: (magazine: Magazine) => void;
}

function optionLabel(option: MagazineOption): string {
  return option.item.name;
}

export function MagazinePicker({ options, value, catalog, onChange }: MagazinePickerProps) {
  const selected = value === null ? undefined : options.find((option) => sameId(option.attachment.id, value.id));
  const types = selected === undefined ? [] : loadedTypes(selected);
  const ammoType = value === null ? null : (types.find((type) => sameId(type, value.ammoType)) ?? null);
  const unitPrice =
    selected === undefined || value === null
      ? null
      : (loadedVariation(catalog, selected.item, value.ammoType)?.price.price ?? null);
  const count = value?.count ?? 0;

  return (
    <div className={styles.picker}>
      <Select
        label="Magazine type"
        items={options}
        getKey={(option) => option.attachment.id}
        getLabel={optionLabel}
        selectedKey={selected?.attachment.id ?? null}
        placeholder="Choose a magazine"
        onSelectionChange={(_key, option) => {
          if (option !== null) onChange(selectMagazine(option, value));
        }}
        renderOption={(option) => (
          <span className={styles.option}>
            <span className={styles.optionName}>{optionLabel(option)}</span>
            <span className={styles.optionFacts}>
              <span>{option.capacity} rounds</span>
              <span>{option.empty === null ? "Empty not sold" : `${formatCash(option.empty.price)} empty`}</span>
              <span>{option.item.weight == null ? "Weight unknown" : formatWeight(option.item.weight)}</span>
            </span>
          </span>
        )}
      />
      {selected !== undefined && value !== null && (
        <>
          <div className={styles.field}>
            <span className={styles.fieldLabel} aria-hidden="true">
              Loaded ammo
            </span>
            {types.length === 0 ? (
              <p className={styles.note}>No pre-loaded magazines are sold for this type.</p>
            ) : (
              <SegmentedControl
                aria-label="Loaded ammo"
                size="sm"
                options={types.map((type) => ({ id: type, label: ammoTypeLabel(type) }))}
                value={ammoType ?? types[0] ?? "FMJ"}
                onChange={(type) => onChange({ ...value, ammoType: type })}
              />
            )}
          </div>
          <div className={styles.lineRow}>
            <NumberField
              label="Magazines"
              minValue={0}
              maxValue={MAX_MAGAZINES}
              value={count}
              onChange={(next) => {
                if (!Number.isNaN(next)) onChange({ ...value, count: Math.round(next) });
              }}
              className={styles.count}
            />
            <dl className={styles.lineTotal}>
              <dt>Line total</dt>
              <dd>{unitPrice === null ? "Not sold in shop" : formatCash(unitPrice * count)}</dd>
            </dl>
          </div>
          <p className={styles.note}>The first magazine is the one in the weapon.</p>
        </>
      )}
    </div>
  );
}
