import { HIT_LOCATIONS, type HitLocation } from "@/core/damage";
import styles from "./BodyZones.module.css";

interface Shape {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ZONE_SHAPES: Record<HitLocation, readonly Shape[]> = {
  Head: [{ x: 48, y: 4, width: 24, height: 30 }],
  Neck: [{ x: 54, y: 36, width: 12, height: 10 }],
  "Torso.Upper": [{ x: 38, y: 48, width: 44, height: 28 }],
  "Torso.Middle": [{ x: 40, y: 78, width: 40, height: 22 }],
  "Torso.Lower": [{ x: 42, y: 102, width: 36, height: 18 }],
  Pelvis: [{ x: 42, y: 122, width: 36, height: 16 }],
  "Arm.Upper": [
    { x: 22, y: 50, width: 14, height: 40 },
    { x: 84, y: 50, width: 14, height: 40 },
  ],
  "Arm.Lower": [
    { x: 18, y: 92, width: 14, height: 36 },
    { x: 88, y: 92, width: 14, height: 36 },
  ],
  "Arm.Hand": [
    { x: 16, y: 130, width: 14, height: 14 },
    { x: 90, y: 130, width: 14, height: 14 },
  ],
  "Leg.Thigh": [
    { x: 42, y: 140, width: 17, height: 46 },
    { x: 61, y: 140, width: 17, height: 46 },
  ],
  "Leg.Calf": [
    { x: 43, y: 188, width: 15, height: 44 },
    { x: 62, y: 188, width: 15, height: 44 },
  ],
  "Leg.Foot": [
    { x: 40, y: 234, width: 19, height: 10 },
    { x: 61, y: 234, width: 19, height: 10 },
  ],
};

export interface BodyZonesProps {
  covered: readonly string[];
  label: string;
}

export function BodyZones({ covered, label }: BodyZonesProps) {
  const isCovered = (location: string) => covered.some((zone) => zone.toLowerCase() === location.toLowerCase());
  return (
    <figure className={styles.figure}>
      <svg viewBox="0 0 120 248" className={styles.body} role="img" aria-label={`Coverage: ${label}`}>
        {HIT_LOCATIONS.map(({ location, label: zoneLabel }) => (
          <g
            key={location}
            data-zone={location}
            data-covered={isCovered(location)}
            className={isCovered(location) ? styles.covered : styles.zone}
          >
            <title>{zoneLabel}</title>
            {ZONE_SHAPES[location].map((shape) => (
              <rect key={`${shape.x}-${shape.y}`} {...shape} rx={location === "Head" ? 10 : 2} />
            ))}
          </g>
        ))}
      </svg>
      <figcaption className={styles.caption}>{label}</figcaption>
    </figure>
  );
}
