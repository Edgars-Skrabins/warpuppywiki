import { Button, Select } from "@/ui";
import { buildLabel, type BuildInfo } from "../state";
import styles from "./BuildPickers.module.css";

export interface BuildPickersProps {
  builds: readonly BuildInfo[];
  from: string;
  to: string;
  onChange: (builds: { from: string; to: string }) => void;
}

export function BuildPickers({ builds, from, to, onChange }: BuildPickersProps) {
  return (
    <div className={styles.pickers}>
      <Select
        label="From"
        items={builds}
        getKey={(build) => build.build}
        getLabel={buildLabel}
        selectedKey={from}
        onSelectionChange={(key) => key !== null && onChange({ from: key, to })}
        className={styles.picker}
      />
      <Button variant="ghost" onPress={() => onChange({ from: to, to: from })} className={styles.swap}>
        Swap
      </Button>
      <Select
        label="To"
        items={builds}
        getKey={(build) => build.build}
        getLabel={buildLabel}
        selectedKey={to}
        onSelectionChange={(key) => key !== null && onChange({ from, to: key })}
        className={styles.picker}
      />
    </div>
  );
}
