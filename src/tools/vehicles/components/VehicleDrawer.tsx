import { useMemo } from "react";
import type { DamageRule } from "@/core/data";
import { Dialog } from "@/ui";
import type { VehicleRow } from "../logic/vehicleRows";
import { vulnerabilities } from "../logic/vulnerabilities";
import { VulnerabilityChart } from "./VulnerabilityChart";
import { VulnerabilityTable } from "./VulnerabilityTable";

export interface VehicleDrawerProps {
  vehicle: VehicleRow | null;
  rules: readonly DamageRule[];
  onClose: () => void;
}

export function VehicleDrawer({ vehicle, rules, onClose }: VehicleDrawerProps) {
  const rows = useMemo(() => (vehicle ? vulnerabilities(rules, vehicle.vehicle.damageEntity) : []), [vehicle, rules]);
  if (!vehicle) return null;
  return (
    <Dialog
      title={`${vehicle.name} vulnerabilities`}
      size="lg"
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <VulnerabilityChart rows={rows} />
      <VulnerabilityTable vehicleName={vehicle.name} rows={rows} />
    </Dialog>
  );
}
