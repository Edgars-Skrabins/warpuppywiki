import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function reducedMotionQuery(): MediaQueryList | null {
  return typeof window.matchMedia === "function" ? window.matchMedia(REDUCED_MOTION_QUERY) : null;
}

function subscribeReducedMotion(onChange: () => void): () => void {
  const query = reducedMotionQuery();
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

function prefersReducedMotion(): boolean {
  return reducedMotionQuery()?.matches ?? false;
}

export interface PlaybackOptions {
  shots: number;
  rpm: number | null;
  speed: number;
}

export interface Playback {
  shown: number;
  playing: boolean;
  play: () => void;
  pause: () => void;
  restart: () => void;
}

export function usePlayback({ shots, rpm, speed }: PlaybackOptions): Playback {
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
  const [shown, setShown] = useState(shots);
  const [playing, setPlaying] = useState(false);
  const [source, setSource] = useState({ shots, rpm });
  const shownRef = useRef(shown);

  if (source.shots !== shots || source.rpm !== rpm) {
    setSource({ shots, rpm });
    setShown(shots);
    setPlaying(false);
  }

  useEffect(() => {
    shownRef.current = shown;
  });

  const animated = !reducedMotion && rpm !== null && rpm > 0;

  useEffect(() => {
    if (!playing || rpm === null) {
      return;
    }
    const interval = 60000 / (rpm * speed);
    const from = shownRef.current;
    let start: number | null = null;
    let frame = requestAnimationFrame(function tick(time) {
      start ??= time;
      const next = Math.min(shots, from + Math.floor((time - start) / interval) + 1);
      shownRef.current = next;
      setShown(next);
      if (next >= shots) {
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing, rpm, speed, shots]);

  const startFrom = useCallback(
    (from: number) => {
      if (!animated || from >= shots) {
        shownRef.current = shots;
        setShown(shots);
        setPlaying(false);
        return;
      }
      shownRef.current = from;
      setShown(from);
      setPlaying(true);
    },
    [animated, shots],
  );

  const play = useCallback(() => startFrom(shownRef.current >= shots ? 0 : shownRef.current), [startFrom, shots]);
  const pause = useCallback(() => setPlaying(false), []);
  const restart = useCallback(() => startFrom(0), [startFrom]);

  return { shown, playing, play, pause, restart };
}
