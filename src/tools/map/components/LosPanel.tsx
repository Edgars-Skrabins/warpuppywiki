import { LOS_NOTES } from "@/core/maps";
import { Button, Checkbox, formatDistance, formatNumber, NumberField, SegmentedControl, Select } from "@/ui";
import { resultLabel, type LosResult } from "../los/losModel";
import {
  APEX_LIMITS,
  clearLosPoints,
  CUSTOM_HEIGHT_LIMITS,
  EXTRA_LOS_NOTES,
  losDataGap,
  NOT_IN_GAME_DATA,
  STANCE_LABELS,
  STANCES,
  TARGET_HEIGHT_LABELS,
  TARGET_HEIGHTS,
  type Los,
  type Stance,
  type TargetHeight,
  type ViewshedRadius,
} from "../los/losState";
import type { ViewshedState } from "../los/useViewshed";
import { VIEWSHED_RADII } from "../los/viewshed";
import { ElevationProfileChart } from "./ElevationProfileChart";
import styles from "./LosPanel.module.css";

export interface LosPanelProps {
  los: Los;
  onLosChange: (update: (los: Los) => Los) => void;
  eyes: Record<Stance, number | null>;
  observerGround: number | null;
  result: LosResult | null;
  viewshed: ViewshedState;
  onHover: (distance: number | null) => void;
}

function meters(value: number | null): string {
  return value === null ? "—" : `${formatNumber(value, { maxFractionDigits: 2 })} m`;
}

function eyeOption(value: number | null): string {
  return value === null ? NOT_IN_GAME_DATA : meters(value);
}

function heightOption(choice: TargetHeight, eyes: Record<Stance, number | null>): string {
  if (choice === "ground") return `${TARGET_HEIGHT_LABELS.ground} (0 m)`;
  if (choice === "custom") return TARGET_HEIGHT_LABELS.custom;
  return `${TARGET_HEIGHT_LABELS[choice]} (${eyeOption(eyes[choice])})`;
}

function ViewshedStatus({ viewshed }: { viewshed: ViewshedState }) {
  switch (viewshed.status) {
    case "idle":
      return <p className={styles.note}>Click the map to set the observer.</p>;
    case "running":
      return (
        <div className={styles.progress}>
          <progress className={styles.bar} value={viewshed.progress} max={1} aria-label="Viewshed progress" />
          <Button size="sm" variant="secondary" onPress={viewshed.cancel}>
            Cancel
          </Button>
        </div>
      );
    case "cancelled":
      return <p className={styles.note}>Cancelled. Click the map to start again.</p>;
    case "done":
      return viewshed.result === null ? (
        <p className={styles.note}>The observer is outside the terrain data.</p>
      ) : (
        <p className={styles.note}>Shaded green: a standing person there can be seen. Red: hidden.</p>
      );
    case "error":
      return <p className={styles.error}>{viewshed.error}</p>;
    case "unsupported":
      return <p className={styles.error}>This browser can't run the viewshed.</p>;
  }
}

export function LosPanel({ los, onLosChange, eyes, observerGround, result, viewshed, onHover }: LosPanelProps) {
  const eye = eyes[los.stance];
  const set = (changes: Partial<Los>) => onLosChange((current) => ({ ...current, ...changes }));
  const hasPoints = los.observer !== null || los.viewshed.observer !== null;
  const gap = losDataGap(los, eyes);

  return (
    <section className={styles.panel} aria-label="Line of sight">
      <header className={styles.header}>
        <h2 className={styles.title}>Line of sight</h2>
        <Button size="sm" variant="ghost" isDisabled={!hasPoints} onPress={() => onLosChange(clearLosPoints)}>
          Clear
        </Button>
      </header>
      <div className={styles.body}>
        <div className={styles.options}>
          <SegmentedControl
            aria-label="Line of sight tool"
            size="sm"
            value={los.tool}
            onChange={(tool) => set({ tool })}
            options={[
              { id: "line", label: "Line" },
              { id: "viewshed", label: "Viewshed" },
            ]}
          />
          <Select
            label="Observer stance"
            items={STANCES}
            getKey={(stance) => stance}
            getLabel={(stance) => `${STANCE_LABELS[stance]} (${eyeOption(eyes[stance])})`}
            selectedKey={los.stance}
            onSelectionChange={(key) => {
              const stance = STANCES.find((candidate) => candidate === key);
              if (stance !== undefined) set({ stance });
            }}
          />
          <dl className={styles.stats}>
            <div>
              <dt>Eye height</dt>
              <dd>{meters(eye)}</dd>
            </div>
            <div>
              <dt>Observer height</dt>
              <dd>{observerGround === null || eye === null ? "—" : meters(observerGround + eye)}</dd>
            </div>
          </dl>
          <Checkbox isSelected={los.buildings} onChange={(buildings) => set({ buildings })}>
            Include buildings
          </Checkbox>
          {los.tool === "line" ? (
            <>
              <Select
                label="Target height"
                items={TARGET_HEIGHTS}
                getKey={(choice) => choice}
                getLabel={(choice) => heightOption(choice, eyes)}
                selectedKey={los.targetHeight}
                onSelectionChange={(key) => {
                  const targetHeight = TARGET_HEIGHTS.find((candidate) => candidate === key);
                  if (targetHeight !== undefined) set({ targetHeight });
                }}
              />
              {los.targetHeight === "custom" && (
                <NumberField
                  label="Your target height"
                  unit="m"
                  minValue={CUSTOM_HEIGHT_LIMITS.min}
                  maxValue={CUSTOM_HEIGHT_LIMITS.max}
                  value={los.customHeight}
                  onChange={(value) => {
                    if (Number.isFinite(value)) set({ customHeight: value });
                  }}
                />
              )}
              <SegmentedControl
                aria-label="Path type"
                size="sm"
                value={los.path}
                onChange={(path) => set({ path })}
                options={[
                  { id: "direct", label: "Direct" },
                  { id: "indirect", label: "Indirect fire" },
                ]}
              />
              {los.path === "indirect" && (
                <NumberField
                  label="Your apex above the higher end"
                  unit="m"
                  minValue={APEX_LIMITS.min}
                  maxValue={APEX_LIMITS.max}
                  step={50}
                  value={los.apex}
                  onChange={(value) => {
                    if (Number.isFinite(value)) set({ apex: value });
                  }}
                />
              )}
            </>
          ) : (
            <>
              <SegmentedControl
                aria-label="Viewshed radius"
                size="sm"
                value={String(los.viewshed.radius)}
                onChange={(value) => set({ viewshed: { ...los.viewshed, radius: Number(value) as ViewshedRadius } })}
                options={VIEWSHED_RADII.map((radius) => ({ id: String(radius), label: formatDistance(radius) }))}
              />
              {gap === null ? <ViewshedStatus viewshed={viewshed} /> : <p className={styles.error}>{gap}</p>}
            </>
          )}
        </div>
        {los.tool === "line" && (
          <div className={styles.result}>
            {gap !== null ? (
              <p className={styles.error} role="status">
                {gap}
              </p>
            ) : los.observer === null || los.target === null ? (
              <p className={styles.note}>Click the map to set the observer, then the target.</p>
            ) : result === null ? (
              <p className={styles.note}>No terrain data at one of the points.</p>
            ) : (
              <>
                <p className={result.clear ? styles.clear : styles.blocked} role="status">
                  {resultLabel(result)}
                </p>
                <ElevationProfileChart result={result} onHover={onHover} />
              </>
            )}
          </div>
        )}
      </div>
      <ul className={styles.notes}>
        {[...LOS_NOTES, ...EXTRA_LOS_NOTES].map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  );
}
