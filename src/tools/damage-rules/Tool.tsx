import { useMemo, useState } from "react";
import type { DamageFile, VehiclesFile } from "@/core/data";
import { useGameDataMany } from "@/core/data";
import { useUrlState } from "@/core/state";
import { DataStateView, Tab, TabList, TabPanel, Tabs, formatNumber } from "@/ui";
import { AmmoEffectivenessTable } from "./components/AmmoEffectivenessTable";
import { AppliesPanel } from "./components/AppliesPanel";
import { MultiplierHeatmap } from "./components/MultiplierHeatmap";
import { RuleFilters } from "./components/RuleFilters";
import { RulesTable } from "./components/RulesTable";
import { VehicleSeatsTable } from "./components/VehicleSeatsTable";
import { applyingRuleIndexes, combinedMultipliers, isHitDescribed } from "./logic/applies";
import { filterRules, indexRules, sortRules, type RuleFilterState } from "./logic/ruleFilters";
import { tagSuggestions } from "./logic/tagSuggestions";
import { TABS, damageRulesState, type DamageRulesTab } from "./state";
import styles from "./Tool.module.css";

interface DamageRulesViewProps {
  damage: DamageFile;
  vehicles: VehiclesFile;
}

function isTab(key: unknown): key is DamageRulesTab {
  return TABS.some((tab) => tab === key);
}

function DamageRulesView({ damage, vehicles }: DamageRulesViewProps) {
  const [state, setState] = useUrlState(damageRulesState);
  const [panelOpen, setPanelOpen] = useState(() => isHitDescribed(state.hit));
  const indexed = useMemo(() => indexRules(damage.rules), [damage.rules]);
  const suggestions = useMemo(() => tagSuggestions(damage.rules), [damage.rules]);

  const { group, entity, categories, source, nonZero, hideFriendly, sort, hit } = state;
  const filters = useMemo<RuleFilterState>(
    () => ({ group, entity, categories, source, nonZero, hideFriendly }),
    [group, entity, categories, source, nonZero, hideFriendly],
  );
  const rows = useMemo(() => sortRules(filterRules(indexed, filters), sort), [indexed, filters, sort]);
  const hitDescribed = isHitDescribed(hit);
  const applying = useMemo(
    () => (hitDescribed ? applyingRuleIndexes(damage.rules, hit) : null),
    [damage.rules, hit, hitDescribed],
  );
  const multipliers = useMemo(
    () => (hitDescribed ? combinedMultipliers(damage.rules, hit) : null),
    [damage.rules, hit, hitDescribed],
  );

  return (
    <Tabs
      selectedKey={state.tab}
      onSelectionChange={(key) => {
        if (isTab(key)) setState((prev) => ({ ...prev, tab: key }));
      }}
    >
      <TabList aria-label="Damage data">
        <Tab id="rules">Rules</Tab>
        <Tab id="multipliers">Body-part multipliers</Tab>
        <Tab id="ammo">Ammo effectiveness</Tab>
        <Tab id="seats">Vehicle seats</Tab>
      </TabList>
      <TabPanel id="rules" className={styles.panel}>
        <AppliesPanel
          isOpen={panelOpen}
          onOpenChange={setPanelOpen}
          hit={hit}
          onHitChange={(next) => setState((prev) => ({ ...prev, hit: next }))}
          suggestions={suggestions}
          multipliers={multipliers}
        />
        <RuleFilters
          rules={damage.rules}
          filters={filters}
          onChange={(patch) => setState((prev) => ({ ...prev, ...patch }))}
        />
        <div className={styles.summary}>
          <span className={styles.count}>
            {formatNumber(rows.length)} of {formatNumber(damage.rules.length)} rules
          </span>
          <span className={styles.note}>
            Default order is the file order (#), which is the order the game evaluates the rules in.
          </span>
        </div>
        <RulesTable
          rows={rows}
          sort={sort}
          onSortChange={(next) => setState((prev) => ({ ...prev, sort: next }))}
          applying={applying}
        />
      </TabPanel>
      <TabPanel id="multipliers" className={styles.panel}>
        <p className={styles.note}>
          Damage multiplier per hit location for each weapon class. Classes without their own row use Universal.
        </p>
        <MultiplierHeatmap rows={damage.hitLocationMultipliers} />
      </TabPanel>
      <TabPanel id="ammo" className={styles.panel}>
        <AmmoEffectivenessTable ammoTypes={damage.ammoTypes} />
      </TabPanel>
      <TabPanel id="seats" className={styles.panel}>
        <VehicleSeatsTable seats={damage.vehicleSeats} vehicles={vehicles.vehicles} />
      </TabPanel>
    </Tabs>
  );
}

export default function DamageRulesTool() {
  const data = useGameDataMany(["damage", "vehicles"]);
  return (
    <DataStateView state={data}>
      {(files) => <DamageRulesView damage={files.damage} vehicles={files.vehicles} />}
    </DataStateView>
  );
}
