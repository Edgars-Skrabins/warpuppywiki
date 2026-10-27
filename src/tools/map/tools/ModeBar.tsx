import { SegmentedControl, Select } from "@/ui";
import { TextInput } from "../components/TextInput";
import { RING_PRESETS, type RingPresetId } from "../plan/ringPresets";
import { MAP_MODES, MODE_LABELS, type MapMode } from "./useMapMode";
import type { PlanEditor } from "./usePlanEditor";
import styles from "./ModeBar.module.css";

interface RingChoice {
  id: RingPresetId;
  label: string;
}

const RING_CHOICES: readonly RingChoice[] = [
  ...RING_PRESETS.map((preset) => ({
    id: preset.id,
    label: `${preset.label} (${preset.distances.map((distance) => distance.toLocaleString("en-US")).join(", ")} m)`,
  })),
  { id: "custom", label: "Custom" },
];

export const TERRAIN_MISSING = "Terrain data isn't installed";

export interface ModeBarProps {
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  editor: PlanEditor;
  hint: string | null;
  losAvailable: boolean;
  losMissing: boolean;
}

export function ModeBar({ mode, onModeChange, editor, hint, losAvailable, losMissing }: ModeBarProps) {
  return (
    <div className={styles.bar}>
      <SegmentedControl
        aria-label="Map tool"
        size="sm"
        className={styles.modes}
        value={mode}
        onChange={onModeChange}
        options={MAP_MODES.map((id) => ({ id, label: MODE_LABELS[id], isDisabled: id === "los" && !losAvailable }))}
      />
      {losMissing && <p className={styles.missing}>Line of sight: {TERRAIN_MISSING}.</p>}
      {mode === "rings" && (
        <div className={styles.options}>
          <Select
            label="Ring distances"
            items={RING_CHOICES}
            getKey={(choice) => choice.id}
            getLabel={(choice) => choice.label}
            selectedKey={editor.ringPreset}
            onSelectionChange={(key) => {
              const choice = RING_CHOICES.find((candidate) => candidate.id === key);
              if (choice !== undefined) {
                editor.setRingPreset(choice.id);
              }
            }}
          />
          {editor.ringPreset === "custom" && (
            <TextInput
              label="Your distances (m)"
              value={editor.customText}
              placeholder="150, 400, 900"
              onChange={(event) => editor.setCustomText(event.target.value)}
              error={editor.custom.ok ? null : editor.custom.error}
            />
          )}
        </div>
      )}
      {hint !== null && (
        <p className={styles.hint} role="status">
          {hint}
        </p>
      )}
    </div>
  );
}
