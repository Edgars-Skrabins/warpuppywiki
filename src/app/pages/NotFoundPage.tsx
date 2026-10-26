import { useEffect } from "react";
import { Link } from "react-router";
import { EmptyState } from "@/ui";
import styles from "./NotFoundPage.module.css";

export function NotFoundPage() {
  useEffect(() => {
    document.title = "Page not found · warpuppywiki";
  }, []);

  return (
    <EmptyState
      title={<span className={styles.title}>Page not found</span>}
      text="There is nothing at this address."
      action={
        <Link to="/" className={styles.link}>
          Back to all tools
        </Link>
      }
    />
  );
}
