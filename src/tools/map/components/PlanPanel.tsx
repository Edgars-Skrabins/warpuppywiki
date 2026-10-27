import { useEffect, useId, useState, type CSSProperties } from "react";
import { Button, Checkbox, Dialog, formatDistance } from "@/ui";
import type { Measurement } from "../plan/measure";
import { isPlanEmpty, PIN_COLOR_TOKENS, type Plan } from "../plan/plan";
import { PinGlyph } from "../tools/PinGlyph";
import { TextInput } from "./TextInput";
import styles from "./PlanPanel.module.css";

export const TOO_LARGE = "Plan too large to share as a link";

type CopyStatus = "idle" | "copied" | "failed";

export interface PlanPanelProps {
  plan: Plan;
  measurement: Measurement;
  threeD: boolean;
  threeDAvailable: boolean;
  onThreeDChange: (threeD: boolean) => void;
  onClearMeasure: () => void;
  onRemoveRingSet: (id: number) => void;
  onEditPin: (id: number) => void;
  onRemovePin: (id: number) => void;
  onClearPlan: () => void;
  shareUrl: string | null;
}

function ringSummary(distances: readonly number[]): string {
  return distances.map((distance) => formatDistance(distance)).join(", ");
}

export function PlanPanel({
  plan,
  measurement,
  threeD,
  threeDAvailable,
  onThreeDChange,
  onClearMeasure,
  onRemoveRingSet,
  onEditPin,
  onRemovePin,
  onClearPlan,
  shareUrl,
}: PlanPanelProps) {
  const [open, setOpen] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [copy, setCopy] = useState<CopyStatus>("idle");
  const bodyId = useId();

  useEffect(() => {
    if (copy !== "copied") {
      return;
    }
    const timer = setTimeout(() => setCopy("idle"), 2000);
    return () => clearTimeout(timer);
  }, [copy]);

  const copyLink = () => {
    if (shareUrl === null) {
      return;
    }
    navigator.clipboard.writeText(shareUrl).then(
      () => setCopy("copied"),
      () => setCopy("failed"),
    );
  };

  const copyText = shareUrl === null ? TOO_LARGE : copy === "copied" ? "Link copied" : "Copy link";

  return (
    <section className={styles.panel} aria-label="Plan">
      <header className={styles.header}>
        <h2 className={styles.title}>Plan</h2>
        <Button size="sm" variant="ghost" aria-expanded={open} aria-controls={bodyId} onPress={() => setOpen(!open)}>
          {open ? "Hide" : "Show"}
        </Button>
      </header>
      {open && (
        <div id={bodyId} className={styles.body}>
          {plan.measure.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Measure</h3>
              <dl className={styles.stats}>
                <div>
                  <dt>Total</dt>
                  <dd>{formatDistance(measurement.total)}</dd>
                </div>
                <div>
                  <dt>Straight line</dt>
                  <dd>{formatDistance(measurement.straight)}</dd>
                </div>
              </dl>
              <Checkbox
                className={styles.checkbox}
                isSelected={threeD && threeDAvailable}
                isDisabled={!threeDAvailable}
                onChange={onThreeDChange}
              >
                3D (ground heights)
              </Checkbox>
              <Button size="sm" variant="secondary" onPress={onClearMeasure}>
                Clear
              </Button>
            </div>
          )}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Range rings</h3>
            {plan.rings.length === 0 ? (
              <p className={styles.empty}>None yet.</p>
            ) : (
              <ul className={styles.list}>
                {plan.rings.map((ringSet, index) => (
                  <li key={ringSet.id} className={styles.item}>
                    <span className={styles.itemText}>
                      <span className={styles.itemName}>Set {index + 1}</span>
                      <span className={styles.itemDetail}>{ringSummary(ringSet.distances)}</span>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Remove ring set ${index + 1}`}
                      onPress={() => onRemoveRingSet(ringSet.id)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Pins</h3>
            {plan.pins.length === 0 ? (
              <p className={styles.empty}>None yet.</p>
            ) : (
              <ul className={styles.list}>
                {plan.pins.map((pin) => (
                  <li key={pin.id} className={styles.item}>
                    <span
                      className={styles.pinSwatch}
                      style={{ "--pin-color": `var(${PIN_COLOR_TOKENS[pin.color]})` } as CSSProperties}
                    >
                      <PinGlyph icon={pin.icon} size={12} />
                    </span>
                    <span className={styles.itemName}>{pin.label}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Edit ${pin.label}`}
                      onPress={() => onEditPin(pin.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Delete ${pin.label}`}
                      onPress={() => onRemovePin(pin.id)}
                    >
                      Delete
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {copy === "failed" && shareUrl !== null && (
            <TextInput label="Copy this link" readOnly value={shareUrl} onFocus={(event) => event.target.select()} />
          )}
          <div className={styles.footer}>
            <Button size="sm" variant="primary" isDisabled={shareUrl === null} onPress={copyLink}>
              {copyText}
            </Button>
            <Button size="sm" variant="secondary" isDisabled={isPlanEmpty(plan)} onPress={() => setConfirming(true)}>
              Clear plan
            </Button>
          </div>
        </div>
      )}
      <Dialog
        title="Clear plan?"
        role="alertdialog"
        size="sm"
        isOpen={confirming}
        onOpenChange={setConfirming}
        actions={(close) => (
          <>
            <Button variant="secondary" onPress={close}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onPress={() => {
                onClearPlan();
                close();
              }}
            >
              Clear plan
            </Button>
          </>
        )}
      >
        This removes the path, range rings and pins on this map.
      </Dialog>
    </section>
  );
}
