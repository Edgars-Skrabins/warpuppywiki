import { Button } from "@/ui";
import styles from "./LoadoutToolbar.module.css";

export interface LoadoutToolbarProps {
  saved: boolean;
  dirty: boolean;
  status: string | null;
  onSave: () => void;
  onSaveAsNew: () => void;
  onOpenLibrary: () => void;
  onShare: () => void;
  onNew: () => void;
}

export function LoadoutToolbar({
  saved,
  dirty,
  status,
  onSave,
  onSaveAsNew,
  onOpenLibrary,
  onShare,
  onNew,
}: LoadoutToolbarProps) {
  const upToDate = saved && !dirty;
  return (
    <div className={styles.toolbar}>
      <div className={styles.buttons} role="toolbar" aria-label="Loadout actions">
        <Button variant="primary" onPress={onSave} aria-label={dirty ? "Save (unsaved changes)" : undefined}>
          {upToDate ? "Saved ✓" : "Save"}
          {dirty && <span className={styles.dot} aria-hidden="true" />}
        </Button>
        <Button onPress={onSaveAsNew}>Save as new</Button>
        <Button onPress={onOpenLibrary}>My loadouts</Button>
        <Button onPress={onShare}>Share</Button>
        <Button variant="ghost" onPress={onNew}>
          New
        </Button>
      </div>
      <p className={styles.status} role="status">
        {status}
      </p>
    </div>
  );
}
