import { useState } from "react";
import { Button } from "@/ui";
import styles from "./LinkToolbar.module.css";

export interface LinkToolbarProps {
  notices: readonly string[];
  getUrl: () => string;
  resetKey: string;
}

export function LinkToolbar({ notices, getUrl, resetKey }: LinkToolbarProps) {
  const [copiedFor, setCopiedFor] = useState<string | null>(null);

  function copyLink() {
    const key = resetKey;
    void navigator.clipboard.writeText(getUrl()).then(() => setCopiedFor(key));
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.notices} role="status">
        {notices.map((notice) => (
          <p key={notice} className={styles.notice}>
            {notice}
          </p>
        ))}
        {copiedFor === resetKey && <p className={styles.copied}>Link copied</p>}
      </div>
      <Button size="sm" onPress={copyLink}>
        Copy link
      </Button>
    </div>
  );
}
