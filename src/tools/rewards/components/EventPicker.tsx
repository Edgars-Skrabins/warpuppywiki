import type { ChallengeEvent, ChallengeReward } from "@/core/data";
import { ComboBox } from "@/ui";
import styles from "./EventPicker.module.css";

interface EventPickerProps {
  rewards: readonly ChallengeReward[];
  eventFor: (id: string) => ChallengeEvent | undefined;
  selectedId: string;
  onSelect: (id: string) => void;
}

function groupOf(reward: ChallengeReward): string {
  return reward.id.split(".")[0] ?? reward.id;
}

export function EventPicker({ rewards, eventFor, selectedId, onSelect }: EventPickerProps) {
  const label = (reward: ChallengeReward) => eventFor(reward.id)?.name ?? reward.id;
  const selected = eventFor(selectedId);
  return (
    <div className={styles.picker}>
      <ComboBox
        label="Event"
        items={rewards}
        getKey={(reward) => reward.id}
        getLabel={label}
        getSearchText={(reward) => `${label(reward)} ${reward.id}`}
        getGroup={groupOf}
        renderOption={(reward) => (
          <span className={styles.option}>
            <span>{label(reward)}</span>
            <span className={styles.id}>{reward.id}</span>
          </span>
        )}
        selectedKey={selectedId}
        onSelectionChange={(key) => {
          if (key !== null) {
            onSelect(key);
          }
        }}
        placeholder="Search events"
      />
      {selected?.description && <p className={styles.description}>{selected.description}</p>}
    </div>
  );
}
