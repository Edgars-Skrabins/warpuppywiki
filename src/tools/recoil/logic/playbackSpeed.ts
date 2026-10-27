export const PLAYBACK_SPEEDS = ["0.25", "0.5", "1"] as const;

export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];
