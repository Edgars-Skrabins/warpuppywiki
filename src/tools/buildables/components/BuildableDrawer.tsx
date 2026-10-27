import { useMemo } from "react";
import type { DamageRule } from "@/core/data";
import { Dialog, formatMultiplier, formatNumber, Panel, Stack, StatRow } from "@/ui";
import type { BuildableRow } from "../logic/buildableRows";
import { buildableRules, entityLabel, rulesForEntity } from "../logic/buildableRules";
import type { ProjectileOption } from "../logic/hitsToDestroy";
import { formatFootprint, formatList } from "./formatValue";
import { HitsToDestroy } from "./HitsToDestroy";
import { RulesTable } from "./RulesTable";

export interface BuildableDrawerProps {
  buildable: BuildableRow | null;
  rules: readonly DamageRule[];
  options: readonly ProjectileOption[];
  onClose: () => void;
}

export function BuildableDrawer({ buildable, rules, options, onClose }: BuildableDrawerProps) {
  const damageEntity = buildable?.damageEntity ?? null;
  const entityRules = useMemo(() => rulesForEntity(rules, damageEntity), [rules, damageEntity]);
  const rows = useMemo(() => buildableRules(rules, damageEntity), [rules, damageEntity]);
  if (!buildable) return null;
  return (
    <Dialog
      title={buildable.name}
      size="lg"
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <Stack gap={5}>
        <div>
          <StatRow label="Cost" value={formatNumber(buildable.cost)} unit="supplies" />
          <StatRow label="Health" value={formatNumber(buildable.health)} />
          <StatRow
            label="Health per supply"
            value={formatNumber(buildable.healthPerSupply, { maxFractionDigits: 1 })}
          />
          <StatRow label="Repair speed" value={formatMultiplier(buildable.repairSpeed)} />
          <StatRow label="Footprint" value={formatFootprint(buildable.footprint)} />
          <StatRow label="Max stack" value={formatNumber(buildable.maxStack)} />
          <StatRow label="Tools" value={formatList(buildable.tools)} />
          <StatRow label="Placement" value={formatList(buildable.placement)} />
        </div>
        <Panel
          title="Damage rules"
          description={damageEntity === null ? undefined : `Damage entity: ${entityLabel(damageEntity)}`}
          headingLevel={3}
        >
          <RulesTable label={`${buildable.name} damage rules`} rows={rows} />
        </Panel>
        <HitsToDestroy
          key={buildable.id}
          buildableName={buildable.name}
          maxHealth={buildable.health}
          options={options}
          rules={entityRules}
        />
      </Stack>
    </Dialog>
  );
}
