import { Suspense, useEffect } from "react";
import type { ToolDefinition } from "@/core/tool";
import { ErrorState, LoadingState } from "@/ui";
import { categoryLabel } from "../categories";
import { ToolStatusBadge } from "../ToolStatusBadge";
import { ToolErrorBoundary } from "../ToolErrorBoundary";
import styles from "./ToolPage.module.css";

function ToolError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className={styles.error}>
      <ErrorState title="This tool hit an error" onRetry={reset} retryLabel="Reload tool" />
      <details className={styles.details}>
        <summary>Error details</summary>
        <pre className={styles.message}>{error.message}</pre>
      </details>
    </div>
  );
}

export function ToolPage({ tool }: { tool: ToolDefinition }) {
  const Tool = tool.component;

  useEffect(() => {
    document.title = `${tool.name} · warpuppywiki`;
  }, [tool.name]);

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <p className={styles.category}>{categoryLabel(tool.category)}</p>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{tool.name}</h1>
          <ToolStatusBadge status={tool.status} />
        </div>
        <p className={styles.summary}>{tool.summary}</p>
        {tool.status === "unreleased" && (
          <p className={styles.notice}>
            This feature isn't released in Wardogs yet. It's built from data already in the game files, which may change
            before release.
          </p>
        )}
      </header>
      <ToolErrorBoundary key={tool.id} fallback={(error, reset) => <ToolError error={error} reset={reset} />}>
        <Suspense fallback={<LoadingState label={`Loading ${tool.name}…`} />}>
          <Tool />
        </Suspense>
      </ToolErrorBoundary>
    </article>
  );
}
