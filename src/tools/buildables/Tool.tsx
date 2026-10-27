import { useMemo } from "react";
import { sameId, useCatalog, type Catalog } from "@/core/catalog";
import { useGameDataMany, type AmmoFile, type BuildablesFile, type DamageFile } from "@/core/data";
import { DataStateView } from "@/ui";
import { BuildableDrawer } from "./components/BuildableDrawer";
import { BuildableTable } from "./components/BuildableTable";
import { buildableRows } from "./logic/buildableRows";
import { projectileOptions } from "./logic/hitsToDestroy";
import { useBuildablesState } from "./state";

interface BuildablesProps {
  catalog: Catalog;
  buildables: BuildablesFile;
  damage: DamageFile;
  ammo: AmmoFile;
}

function Buildables({ catalog, buildables, damage, ammo }: BuildablesProps) {
  const { selectedId, setSelectedId } = useBuildablesState();
  const rows = useMemo(() => buildableRows(buildables.buildables), [buildables]);
  const options = useMemo(() => projectileOptions(ammo.projectiles, catalog), [ammo, catalog]);
  const selected = selectedId === null ? null : (rows.find((row) => sameId(row.id, selectedId)) ?? null);

  return (
    <>
      <BuildableTable rows={rows} onOpen={(row) => setSelectedId(row.id)} />
      <BuildableDrawer
        buildable={selected}
        rules={damage.rules}
        options={options}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
}

export default function Tool() {
  const catalog = useCatalog();
  const data = useGameDataMany(["buildables", "damage", "ammo"]);
  return (
    <DataStateView state={catalog}>
      {(loadedCatalog) => (
        <DataStateView state={data}>
          {({ buildables, damage, ammo }) => (
            <Buildables catalog={loadedCatalog} buildables={buildables} damage={damage} ammo={ammo} />
          )}
        </DataStateView>
      )}
    </DataStateView>
  );
}
