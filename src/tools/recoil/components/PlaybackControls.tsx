import { Button, SegmentedControl, Stack } from "@/ui";
import { PLAYBACK_SPEEDS, type PlaybackSpeed } from "../logic/playbackSpeed";

const SPEED_OPTIONS = PLAYBACK_SPEEDS.map((speed) => ({ id: speed, label: `${speed}×` }));

export interface PlaybackControlsProps {
  playing: boolean;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  speed: PlaybackSpeed;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  isDisabled: boolean;
}

export function PlaybackControls({
  playing,
  onPlay,
  onPause,
  onRestart,
  speed,
  onSpeedChange,
  isDisabled,
}: PlaybackControlsProps) {
  return (
    <Stack direction="horizontal" gap={2} align="center" wrap>
      {playing ? (
        <Button size="sm" onPress={onPause}>
          Pause
        </Button>
      ) : (
        <Button size="sm" variant="primary" onPress={onPlay} isDisabled={isDisabled}>
          Play
        </Button>
      )}
      <Button size="sm" variant="ghost" onPress={onRestart} isDisabled={isDisabled}>
        Restart
      </Button>
      <SegmentedControl
        aria-label="Playback speed"
        size="sm"
        options={SPEED_OPTIONS}
        value={speed}
        onChange={onSpeedChange}
        isDisabled={isDisabled}
      />
    </Stack>
  );
}
