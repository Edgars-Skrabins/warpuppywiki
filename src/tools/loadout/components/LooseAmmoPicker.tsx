import { sameId, type Catalog } from "@/core/catalog";
import type { AmmoOption } from "@/core/weapons";
import { formatCash, NumberField, Select } from "@/ui";
import { MAX_LOOSE_ROUNDS, type WeaponSetup } from "../model/loadout";
import { ammoLot, lotsFor, preferredAmmo, snapRounds } from "../model/weaponSetup";
import styles from "./SetupPickers.module.css";

type LooseAmmo = NonNullable<WeaponSetup["looseAmmo"]>;

export interface LooseAmmoPickerProps {
  options: readonly AmmoOption[];
  value: WeaponSetup["looseAmmo"];
  catalog: Catalog;
  onChange: (looseAmmo: LooseAmmo) => void;
}

export function LooseAmmoPicker({ options, value, catalog, onChange }: LooseAmmoPickerProps) {
  if (options.length === 0) {
    return <p className={styles.note}>No ammunition in the game data fits this weapon.</p>;
  }
  const selected =
    (value === null ? undefined : options.find((option) => sameId(option.item.id, value.itemId))) ??
    preferredAmmo(options);
  const itemId = selected?.item.id ?? value?.itemId ?? "";
  const lot = ammoLot(catalog, itemId);
  const rounds = value?.rounds ?? 0;
  const maxRounds = Math.floor(MAX_LOOSE_ROUNDS / lot.size) * lot.size;

  return (
    <div className={styles.picker}>
      <Select
        label="Ammo type"
        items={options}
        getKey={(option) => option.item.id}
        getLabel={(option) => option.item.name}
        selectedKey={selected?.item.id ?? null}
        onSelectionChange={(_key, option) => {
          if (option === null) return;
          const size = ammoLot(catalog, option.item.id).size;
          onChange({ itemId: option.item.id, rounds: snapRounds(rounds, size) });
        }}
        renderOption={(option) => {
          const price = catalog.price(option.item.id);
          return (
            <span className={styles.option}>
              <span className={styles.optionName}>{option.item.name}</span>
              <span className={styles.optionFacts}>
                <span>
                  {price === null ? "Not sold in shop" : `${formatCash(price.price)} per ${price.amount} rounds`}
                </span>
              </span>
            </span>
          );
        }}
      />
      <div className={styles.lineRow}>
        <NumberField
          label="Rounds"
          minValue={0}
          maxValue={maxRounds}
          step={lot.size}
          value={rounds}
          onChange={(next) => {
            if (!Number.isNaN(next)) onChange({ itemId, rounds: snapRounds(next, lot.size) });
          }}
          className={styles.count}
        />
        <dl className={styles.lineTotal}>
          <dt>Line total</dt>
          <dd>{lot.price === null ? "Not sold in shop" : formatCash(lotsFor(rounds, lot.size) * lot.price.price)}</dd>
        </dl>
      </div>
      <p className={styles.note}>{lot.price === null ? "Not sold in shop." : `Sold in lots of ${lot.size} rounds.`}</p>
    </div>
  );
}
