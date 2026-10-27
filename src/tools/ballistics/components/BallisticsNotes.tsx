import { Panel } from "@/ui";
import type { DragModel } from "../logic/dragTables";
import { AIR_DENSITY, GRAVITY, SPEED_OF_SOUND } from "../logic/trajectory";
import { LEAD_TARGET_SPEED } from "../logic/rangeCard";
import { SIGHT_HEIGHT } from "../logic/zero";
import styles from "./BallisticsNotes.module.css";

export interface DragModelNote {
  label: string;
  sourceModel: string | null;
  model: DragModel;
}

function dragModelText({ label, sourceModel, model }: DragModelNote): string {
  const source = sourceModel ?? "no drag model";
  return sourceModel?.trim().toUpperCase().startsWith(model)
    ? `${label}: ${source}, using the standard ${model} drag function.`
    : `${label}: the game data names ${source}, so the standard ${model} drag function is used instead.`;
}

export function BallisticsNotes({ dragModels }: { dragModels: readonly DragModelNote[] }) {
  return (
    <Panel title="How this is calculated" headingLevel={3}>
      <ul className={styles.notes}>
        <li>
          Every value here is an approximation of the game&apos;s ballistics, which are not part of the published data.
        </li>
        <li>
          A point-mass trajectory in distance and height, integrated with fourth-order Runge–Kutta in 1 ms steps from
          the muzzle.
        </li>
        <li>
          Drag deceleration is ρ v² Cd A / 2m with air density {AIR_DENSITY} kg/m³ and A = π d² / 4. The
          projectile&apos;s drag coefficient is read as a form factor on a standard drag function, with Mach from{" "}
          {SPEED_OF_SOUND} m/s.
        </li>
        {dragModels.map((note) => (
          <li key={note.label}>{dragModelText(note)}</li>
        ))}
        <li>
          Gravity {GRAVITY} m/s². The sight sits {SIGHT_HEIGHT * 100} cm above the bore, and the bore is angled so the
          bullet crosses the line of sight at the zero distance.
        </li>
        <li>No wind, no change in air density with altitude, no spin drift.</li>
        <li>
          Holdover is drop ÷ distance in thousandths (mil). Lead is for a target crossing at {LEAD_TARGET_SPEED} m/s.
          Damage per hit is the projectile&apos;s damage times the weapon&apos;s falloff at that distance.
        </li>
      </ul>
    </Panel>
  );
}
