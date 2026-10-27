import type { KeyboardEvent } from "react";
import { hitLocationLabel, type HitLocation } from "@/core/damage";
import { Button } from "@/ui";
import styles from "./BodyMap.module.css";

const ZONE_PATHS: readonly { location: HitLocation; d: string }[] = [
  { location: "Head", d: "M80 38 a20 25 0 1 0 40 0 a20 25 0 1 0 -40 0 Z" },
  { location: "Neck", d: "M92 63 H108 V79 H92 Z" },
  { location: "Torso.Upper", d: "M68 82 Q100 76 132 82 L135 128 H65 Z" },
  { location: "Torso.Middle", d: "M65 128 H135 L132 160 H68 Z" },
  { location: "Torso.Lower", d: "M68 160 H132 L130 188 H70 Z" },
  { location: "Pelvis", d: "M70 188 H130 L134 214 L100 222 L66 214 Z" },
  { location: "Arm.Upper", d: "M66 84 L54 88 L46 148 L60 150 Z M134 84 L146 88 L154 148 L140 150 Z" },
  { location: "Arm.Lower", d: "M46 150 L60 152 L56 206 L42 204 Z M154 150 L140 152 L144 206 L158 204 Z" },
  { location: "Arm.Hand", d: "M42 206 L56 208 L56 228 L40 226 Z M158 206 L144 208 L144 228 L160 226 Z" },
  { location: "Leg.Thigh", d: "M66 216 L98 223 L96 296 L74 296 Z M134 216 L102 223 L104 296 L126 296 Z" },
  { location: "Leg.Calf", d: "M74 298 H96 L94 368 H78 Z M126 298 H104 L106 368 H122 Z" },
  { location: "Leg.Foot", d: "M78 370 H94 L96 390 H70 Z M122 370 H106 L104 390 H130 Z" },
];

export interface BodyMapProps {
  sequence: readonly HitLocation[];
  covered: ReadonlySet<HitLocation>;
  maxZones: number;
  onChange: (sequence: HitLocation[]) => void;
}

export function BodyMap({ sequence, covered, maxZones, onChange }: BodyMapProps) {
  const isFull = sequence.length >= maxZones;

  function add(location: HitLocation) {
    if (!isFull) {
      onChange([...sequence, location]);
    }
  }

  function onKeyDown(event: KeyboardEvent<SVGPathElement>, location: HitLocation) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      add(location);
    }
  }

  return (
    <div className={styles.bodyMap}>
      <svg viewBox="0 0 200 400" className={styles.figure} aria-label="Hit zones" role="group">
        {ZONE_PATHS.map((zone) => (
          <path
            key={zone.location}
            d={zone.d}
            role="button"
            tabIndex={0}
            aria-label={`Add ${hitLocationLabel(zone.location)}`}
            aria-disabled={isFull}
            data-covered={covered.has(zone.location)}
            className={styles.zone}
            onClick={() => add(zone.location)}
            onKeyDown={(event) => onKeyDown(event, zone.location)}
          >
            <title>{hitLocationLabel(zone.location)}</title>
          </path>
        ))}
      </svg>
      <div className={styles.sequence}>
        {sequence.length === 0 ? (
          <p className={styles.hint}>Pick at least one hit zone</p>
        ) : (
          <ol className={styles.chips} aria-label="Shot sequence">
            {sequence.map((location, index) => (
              <li key={`${index}-${location}`} className={styles.chip}>
                <span className={styles.chipIndex}>{index + 1}</span>
                {hitLocationLabel(location)}
                <button
                  type="button"
                  className={styles.chipRemove}
                  aria-label={`Remove shot ${index + 1}, ${hitLocationLabel(location)}`}
                  onClick={() => onChange(sequence.filter((_, position) => position !== index))}
                >
                  ×
                </button>
              </li>
            ))}
          </ol>
        )}
        <Button size="sm" variant="ghost" isDisabled={sequence.length === 0} onPress={() => onChange([])}>
          Clear
        </Button>
      </div>
    </div>
  );
}
