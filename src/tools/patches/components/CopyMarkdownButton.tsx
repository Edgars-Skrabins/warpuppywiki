import { useEffect, useState } from "react";
import { Button, Dialog } from "@/ui";
import styles from "./CopyMarkdownButton.module.css";

export interface CopyMarkdownButtonProps {
  getText: () => string;
  isDisabled?: boolean;
}

const COPIED_DURATION_MS = 2000;

export function CopyMarkdownButton({ getText, isDisabled }: CopyMarkdownButtonProps) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = setTimeout(() => setCopied(false), COPIED_DURATION_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    const text = getText();
    const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
    try {
      if (!clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }
      await clipboard.writeText(text);
      setCopied(true);
    } catch {
      setFallback(text);
    }
  };

  return (
    <>
      <Button size="sm" onPress={() => void copy()} isDisabled={isDisabled}>
        {copied ? "Copied" : "Copy as Markdown"}
      </Button>
      <Dialog
        title="Copy as Markdown"
        size="lg"
        isOpen={fallback !== null}
        onOpenChange={(isOpen) => !isOpen && setFallback(null)}
      >
        <p className={styles.hint}>The clipboard isn't available. Select the text and copy it.</p>
        <textarea
          className={styles.text}
          aria-label="Markdown"
          readOnly
          value={fallback ?? ""}
          onFocus={(event) => event.currentTarget.select()}
        />
      </Dialog>
    </>
  );
}
