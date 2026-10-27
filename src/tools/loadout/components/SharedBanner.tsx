import { Button } from "@/ui";
import styles from "./SharedBanner.module.css";

export interface SharedBannerProps {
  onSave: () => void;
}

export function SharedBanner({ onSave }: SharedBannerProps) {
  return (
    <div className={styles.banner} role="note">
      <p className={styles.text}>Shared loadout — Save to keep it</p>
      <Button size="sm" onPress={onSave}>
        Save to my loadouts
      </Button>
    </div>
  );
}
