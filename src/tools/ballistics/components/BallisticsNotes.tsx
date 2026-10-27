import { Panel } from "@/ui";
import type { DragModel } from "../logic/dragTables";
import { AIR_DENSITY, GRAVITY, SPEED_OF_SOUND } from "../logic/trajectory";
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
          projectile&apos;s drag coefficient is read as a form factor on the standard G7 drag function (G1 where the
          game data names G1), with Mach from {SPEED_OF_SOUND} m/s. That reading is an interpretation: the game data
          does not say how the coefficient is used.
        </li>
        {dragModels.map((note) => (
          <li key={note.label}>{dragModelText(note)}</li>
        ))}
        <li>
          Gravity {GRAVITY} m/s². The bullet is fired along the bore, and drop is measured below the bore line, a
          straight line along the barrel.
        </li>
        <li>No wind, no change in air density with altitude, no spin drift.</li>
        <li>
          Hold is how far to aim above the bore line, drop ÷ distance in thousandths (mil). Lead uses the target speed
          you type in and is shown only when you enter one. Damage per hit is the projectile&apos;s damage times the
          weapon&apos;s falloff at that distance.
        </li>
      </ul>
    </Panel>
  );
}
