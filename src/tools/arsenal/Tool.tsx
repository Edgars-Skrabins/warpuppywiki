import { useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { useCatalog, type Catalog } from "@/core/catalog";
import { useDamageModel, type DamageModel } from "@/core/damage";
import { useUrlState } from "@/core/state";
import { Button, DataStateView, EmptyState } from "@/ui";
import { WeaponDetail } from "./components/WeaponDetail";
import { WeaponFilters } from "./components/WeaponFilters";
import { WeaponTable } from "./components/WeaponTable";
import { weaponDetail } from "./logic/weaponDetail";
import { filterRows, weaponRows, type ArsenalData, type WeaponRow } from "./logic/weaponRows";
import { DEFAULT_FILTERS, filtersCodec, WEAPON_PARAM } from "./state";
import styles from "./Tool.module.css";

function Arsenal({ model, catalog }: { model: DamageModel; catalog: Catalog }) {
  const data = useMemo<ArsenalData>(
    () => ({ catalog, index: model.weapons, damage: model.damage, equipment: model.equipment }),
    [model, catalog],
  );
  const [filters, setFilters] = useUrlState(filtersCodec);
  const [searchParams, setSearchParams] = useSearchParams();
  const rows = useMemo(() => weaponRows(data), [data]);
  const visible = useMemo(() => filterRows(rows, filters), [rows, filters]);
  const selectedId = searchParams.get(WEAPON_PARAM);
  const selected = selectedId === null ? undefined : data.index.weapon(selectedId);
  const detail = useMemo(() => (selected ? weaponDetail(data, selected) : null), [data, selected]);

  const backTo = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    params.delete(WEAPON_PARAM);
    return `?${params.toString()}`;
  }, [searchParams]);

  const open = useCallback(
    (row: WeaponRow) =>
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set(WEAPON_PARAM, row.id);
        return params;
      }),
    [setSearchParams],
  );

  return (
    <div className={styles.tool}>
      {selectedId !== null && detail === null && (
        <EmptyState
          title="This weapon is not in the game data"
          action={
            <Link to={backTo} className={styles.link}>
              ← All weapons
            </Link>
          }
        />
      )}
      {detail !== null && <WeaponDetail detail={detail} backTo={backTo} />}
      <div className={styles.list} hidden={selectedId !== null}>
        <WeaponFilters filters={filters} onChange={setFilters} resultCount={visible.length} />
        {visible.length === 0 ? (
          <EmptyState
            title="No weapons match these filters"
            action={<Button onPress={() => setFilters(DEFAULT_FILTERS)}>Clear filters</Button>}
          />
        ) : (
          <WeaponTable rows={visible} onOpen={open} />
        )}
      </div>
    </div>
  );
}

export default function Tool() {
  const catalog = useCatalog();
  const model = useDamageModel();
  return (
    <DataStateView state={catalog}>
      {(loadedCatalog) => (
        <DataStateView state={model}>
          {(loadedModel) => <Arsenal model={loadedModel} catalog={loadedCatalog} />}
        </DataStateView>
      )}
    </DataStateView>
  );
}
