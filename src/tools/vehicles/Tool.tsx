import { useCallback, useMemo, useState } from "react";
import { sameId, useCatalog } from "@/core/catalog";
import { useGameDataMany, type DamageFile, type Vehicle } from "@/core/data";
import { DataStateView, Tab, TabList, TabPanel, Tabs } from "@/ui";
import { CompareView } from "./components/CompareView";
import { VehicleDrawer } from "./components/VehicleDrawer";
import { VehicleTable } from "./components/VehicleTable";
import { vehicleRows, type VehicleCatalog, type VehicleRow } from "./logic/vehicleRows";
import { toggleCompareId, useVehiclesState, type VehiclesView } from "./state";

interface VehiclesProps {
  catalog: VehicleCatalog;
  vehicles: readonly Vehicle[];
  damage: DamageFile;
}

function Vehicles({ catalog, vehicles, damage }: VehiclesProps) {
  const { view, setView, compareIds, setCompareIds } = useVehiclesState();
  const [open, setOpen] = useState<VehicleRow | null>(null);
  const rows = useMemo(() => vehicleRows(vehicles, catalog), [vehicles, catalog]);
  const compared = useMemo(
    () => compareIds.flatMap((id) => rows.filter((row) => sameId(row.id, id))),
    [compareIds, rows],
  );
  const toggle = useCallback(
    (id: string) => setCompareIds(toggleCompareId(compareIds, id)),
    [compareIds, setCompareIds],
  );

  return (
    <>
      <Tabs selectedKey={view} onSelectionChange={(key) => setView(key as VehiclesView)}>
        <TabList aria-label="Vehicles view">
          <Tab id="table">All vehicles</Tab>
          <Tab id="compare">Compare</Tab>
        </TabList>
        <TabPanel id="table">
          <VehicleTable
            rows={rows}
            selectedIds={compared.map((row) => row.id)}
            onToggle={toggle}
            onCompare={() => setView("compare")}
            onOpen={setOpen}
          />
        </TabPanel>
        <TabPanel id="compare">
          <CompareView vehicles={compared} damage={damage} onRemove={toggle} />
        </TabPanel>
      </Tabs>
      <VehicleDrawer vehicle={open} rules={damage.rules} onClose={() => setOpen(null)} />
    </>
  );
}

export default function Tool() {
  const catalog = useCatalog();
  const data = useGameDataMany(["vehicles", "damage"]);
  return (
    <DataStateView state={catalog}>
      {(loadedCatalog) => (
        <DataStateView state={data}>
          {({ vehicles, damage }) => <Vehicles catalog={loadedCatalog} vehicles={vehicles.vehicles} damage={damage} />}
        </DataStateView>
      )}
    </DataStateView>
  );
}
