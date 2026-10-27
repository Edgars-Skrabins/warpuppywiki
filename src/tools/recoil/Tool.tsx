import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useUrlState } from "@/core/state";
import { useWeaponIndex, type PlayerWeapon, type WeaponIndex } from "@/core/weapons";
import { DataStateView, EmptyState, Panel, seriesColor, Stack } from "@/ui";
import { AttachmentControls } from "./components/AttachmentControls";
import { ComparePicker } from "./components/ComparePicker";
import { PlaybackControls } from "./components/PlaybackControls";
import { RecoilPlot, type PlotSeries } from "./components/RecoilPlot";
import { RecoilStats } from "./components/RecoilStats";
import { WeaponPicker } from "./components/WeaponPicker";
import { usePlayback } from "./hooks/usePlayback";
import type { PlaybackSpeed } from "./logic/playbackSpeed";
import { mirrorBounds, mirrorPath, squareFrame, unionBounds, type Bounds } from "./logic/recoilPath";
import { hasRecoilPattern, weaponRecoil, type WeaponRecoil } from "./logic/weaponSetup";
import { EMPTY_SETUP, recoilState, WEAPON_PARAM, type WeaponSetup } from "./state";
import styles from "./Tool.module.css";

interface Shown {
  weapon: PlayerWeapon;
  recoil: WeaponRecoil;
}

function useShown(index: WeaponIndex, setup: WeaponSetup | null, fallbackId: string | null = null): Shown | null {
  const id = setup?.weapon ?? fallbackId;
  const weapon = id === null ? undefined : index.weapon(id);
  const slots = setup?.slots;
  return useMemo(
    () => (weapon === undefined ? null : { weapon, recoil: weaponRecoil(index, weapon, slots ?? {}) }),
    [index, weapon, slots],
  );
}

function SetupControls({
  index,
  shown,
  setup,
  onChange,
}: {
  index: WeaponIndex;
  shown: Shown | null;
  setup: WeaponSetup;
  onChange: (setup: WeaponSetup) => void;
}) {
  if (shown === null || !hasRecoilPattern(shown.weapon)) {
    return null;
  }
  return (
    <AttachmentControls
      index={index}
      weapon={shown.weapon}
      selections={setup.slots}
      stats={shown.recoil.stats}
      onSelectionChange={(slot, attachmentId) =>
        onChange({ weapon: shown.weapon.id, slots: { ...setup.slots, [slot]: attachmentId } })
      }
    />
  );
}

function PatternNote({ shown }: { shown: Shown }) {
  const length = shown.recoil.summary.patternLength;
  if (length === 0) {
    return (
      <EmptyState
        title="No pattern"
        text={`The game files give ${shown.weapon.name} no per-shot recoil pattern, so there is nothing to draw.`}
      />
    );
  }
  if (length === 1) {
    return <p className={styles.note}>{shown.weapon.name} has a single kick: its pattern is one shot.</p>;
  }
  return null;
}

function RecoilViewer({ index }: { index: WeaponIndex }) {
  const [state, setState] = useUrlState(recoilState);
  const [searchParams] = useSearchParams();
  const [lockedBounds, setLockedBounds] = useState<Bounds | null>(null);
  const [speed, setSpeed] = useState<PlaybackSpeed>("1");

  const primary = useShown(index, state.primary, searchParams.get(WEAPON_PARAM));
  const compare = useShown(index, state.compare);
  const comparing = state.compare !== null;

  const primaryPlayback = usePlayback({
    shots: primary?.recoil.path.points.length ?? 0,
    rpm: primary?.weapon.stats.rpm ?? null,
    speed: Number(speed),
  });
  const comparePlayback = usePlayback({
    shots: compare?.recoil.path.points.length ?? 0,
    rpm: compare?.weapon.stats.rpm ?? null,
    speed: Number(speed),
  });

  const drawn = [primary, compare].filter((entry): entry is Shown => entry !== null && hasRecoilPattern(entry.weapon));
  const ownBounds = unionBounds(drawn.map((entry) => entry.recoil.path.bounds));
  const aimBounds = comparing || lockedBounds === null ? ownBounds : lockedBounds;
  const frame = squareFrame(state.view === "guide" ? mirrorBounds(aimBounds) : aimBounds);

  const series: PlotSeries[] = [
    { shown: primary, playback: primaryPlayback },
    { shown: compare, playback: comparePlayback },
  ].flatMap(({ shown, playback }, position) =>
    shown === null || !hasRecoilPattern(shown.weapon)
      ? []
      : [
          {
            key: `${position}`,
            label: shown.weapon.name,
            color: seriesColor(position),
            path: state.view === "guide" ? mirrorPath(shown.recoil.path) : shown.recoil.path,
            shown: playback.shown,
          },
        ],
  );

  const playbacks = [primaryPlayback, comparePlayback];

  return (
    <div className={styles.layout}>
      <Stack gap={6} className={styles.controls}>
        <Panel title="Weapon" headingLevel={2}>
          <Stack gap={3}>
            <WeaponPicker
              label="Weapon"
              weapons={index.playerWeapons}
              selectedId={primary?.weapon.id ?? null}
              onChange={(weaponId) => setState((prev) => ({ ...prev, primary: { weapon: weaponId, slots: {} } }))}
            />
            <SetupControls
              index={index}
              shown={primary}
              setup={state.primary}
              onChange={(setup) => setState((prev) => ({ ...prev, primary: setup }))}
            />
          </Stack>
        </Panel>
        <Panel title="Compare" headingLevel={2}>
          <Stack gap={3}>
            <ComparePicker
              weapons={index.playerWeapons}
              comparing={comparing}
              selectedId={compare?.weapon.id ?? null}
              onAdd={() => setState((prev) => ({ ...prev, compare: EMPTY_SETUP }))}
              onRemove={() => setState((prev) => ({ ...prev, compare: null }))}
              onChange={(weaponId) => setState((prev) => ({ ...prev, compare: { weapon: weaponId, slots: {} } }))}
            />
            {state.compare !== null && (
              <SetupControls
                index={index}
                shown={compare}
                setup={state.compare}
                onChange={(setup) => setState((prev) => ({ ...prev, compare: setup }))}
              />
            )}
          </Stack>
        </Panel>
      </Stack>
      <Stack gap={6} className={styles.main}>
        <Panel
          title="Recoil pattern"
          headingLevel={2}
          actions={
            <PlaybackControls
              playing={playbacks.some((playback) => playback.playing)}
              onPlay={() => playbacks.forEach((playback) => playback.play())}
              onPause={() => playbacks.forEach((playback) => playback.pause())}
              onRestart={() => playbacks.forEach((playback) => playback.restart())}
              speed={speed}
              onSpeedChange={setSpeed}
              isDisabled={series.length === 0}
            />
          }
        >
          <Stack gap={3}>
            {primary === null ? (
              <EmptyState title="Choose a weapon" text="Pick a weapon to draw its recoil pattern." />
            ) : (
              <PatternNote shown={primary} />
            )}
            {compare !== null && <PatternNote shown={compare} />}
            {series.length > 0 && (
              <RecoilPlot
                series={series}
                frame={frame}
                view={state.view}
                onViewChange={(view) => setState((prev) => ({ ...prev, view }))}
                lockScale={lockedBounds !== null}
                onLockScaleChange={(locked) => setLockedBounds(locked ? ownBounds : null)}
                lockDisabled={comparing}
              />
            )}
          </Stack>
        </Panel>
        {drawn.length > 0 && (
          <div className={styles.stats}>
            {drawn.map((entry) => (
              <Panel key={entry.weapon.id} title={entry.weapon.name} headingLevel={3}>
                <RecoilStats stats={entry.recoil.summary} />
              </Panel>
            ))}
          </div>
        )}
      </Stack>
    </div>
  );
}

export default function Tool() {
  const state = useWeaponIndex();
  return <DataStateView state={state}>{(index) => <RecoilViewer index={index} />}</DataStateView>;
}
