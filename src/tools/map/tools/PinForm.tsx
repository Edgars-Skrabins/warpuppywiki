import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Button, SegmentedControl } from "@/ui";
import { TextInput } from "../components/TextInput";
import {
  PIN_COLOR_LABELS,
  PIN_COLOR_TOKENS,
  PIN_COLORS,
  PIN_ICON_LABELS,
  PIN_ICONS,
  PLAN_LIMITS,
  type Pin,
  type PinChanges,
} from "../plan/plan";
import { PinGlyph } from "./PinGlyph";
import styles from "./PinForm.module.css";

export interface PinFormProps {
  pin: Pin;
  onChange: (changes: PinChanges) => void;
  onDelete: () => void;
  onDone: () => void;
}

export function PinForm({ pin, onChange, onDelete, onDone }: PinFormProps) {
  const [label, setLabel] = useState(pin.label);
  const root = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const element = root.current;
    if (element === null) {
      return;
    }
    const stop = (event: Event) => event.stopPropagation();
    element.addEventListener("keydown", stop);
    return () => element.removeEventListener("keydown", stop);
  }, []);

  const commitLabel = () => {
    if (label !== pin.label) {
      onChange({ label });
    }
  };

  return (
    <form
      ref={root}
      className={styles.form}
      aria-label={`Edit ${pin.label}`}
      onSubmit={(event) => {
        event.preventDefault();
        commitLabel();
        onDone();
      }}
    >
      <TextInput
        label="Label"
        value={label}
        maxLength={PLAN_LIMITS.labelLength}
        onChange={(event) => setLabel(event.target.value)}
        onBlur={commitLabel}
        autoFocus
      />
      <div className={styles.group}>
        <span className={styles.groupLabel}>Color</span>
        <SegmentedControl
          aria-label="Color"
          size="sm"
          value={pin.color}
          onChange={(color) => onChange({ color })}
          options={PIN_COLORS.map((color) => ({
            id: color,
            ariaLabel: PIN_COLOR_LABELS[color],
            label: (
              <span
                className={styles.swatch}
                style={{ "--pin-color": `var(${PIN_COLOR_TOKENS[color]})` } as CSSProperties}
              />
            ),
          }))}
        />
      </div>
      <div className={styles.group}>
        <span className={styles.groupLabel}>Icon</span>
        <SegmentedControl
          aria-label="Icon"
          size="sm"
          value={pin.icon}
          onChange={(icon) => onChange({ icon })}
          options={PIN_ICONS.map((icon) => ({
            id: icon,
            ariaLabel: PIN_ICON_LABELS[icon],
            label: <PinGlyph icon={icon} size={14} />,
          }))}
        />
      </div>
      <div className={styles.actions}>
        <Button size="sm" variant="danger" onPress={onDelete}>
          Delete
        </Button>
        <Button size="sm" variant="primary" type="submit">
          Done
        </Button>
      </div>
    </form>
  );
}
