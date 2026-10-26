import { Link } from "react-router";
import type { ToolDefinition } from "@/core/tool";
import { Badge } from "@/ui";
import { ThemeToggle } from "./ThemeToggle";
import { ToolsMenu } from "./ToolsMenu";
import styles from "./Header.module.css";

export function Header({ tools }: { tools: readonly ToolDefinition[] }) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.wordmark} aria-label="warpuppywiki home">
          <span className={styles.name}>Warpuppy</span>
          <Badge tone="tag" className={styles.tag}>
            Wiki
          </Badge>
        </Link>
        <nav aria-label="Main" className={styles.nav}>
          <ToolsMenu tools={tools} />
          <ThemeToggle className={styles.theme} />
        </nav>
      </div>
    </header>
  );
}
