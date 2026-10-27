import { Link } from "react-router";
import { useAssetsManifest } from "@/core/data";
import type { ToolDefinition } from "@/core/tool";
import { Icon } from "@/ui";
import { categoryLabel } from "../../categories";
import { toolIcon } from "../../toolIcon";
import { ToolStatusBadge } from "../../ToolStatusBadge";
import type { HomeLayoutProps } from "./types";
import styles from "./BriefingLayout.module.css";

const FEATURED = ["loadout", "ttk", "map"] as const;

const ART: Record<string, { path: string; kind: "render" | "map" }> = {
  loadout: { path: "icons/UI/Shared/Icons/Vendor/Weapons/T_UI_Vendor_WEPN_001v2.png", kind: "render" },
  ttk: { path: "icons/UI/Shared/Icons/Vendor/Weapons/T_UI_Vendor_WEPN_008.png", kind: "render" },
  map: { path: "maps/kavkazi/overview.webp", kind: "map" },
};

function FeatureCard({ tool, hasAssets }: { tool: ToolDefinition; hasAssets: boolean }) {
  const art = ART[tool.id];
  return (
    <Link to={`/${tool.id}`} className={styles.feature}>
      <span className={art?.kind === "map" ? styles.artMap : styles.art}>
        {hasAssets && art ? (
          <img src={`${import.meta.env.BASE_URL}assets/${art.path}`} alt="" loading="lazy" />
        ) : (
          <Icon name={toolIcon(tool)} size={48} className={styles.fallbackIcon} />
        )}
      </span>
      <span className={styles.featureText}>
        <span className={styles.kicker}>{categoryLabel(tool.category)}</span>
        <span className={styles.featureName}>
          {tool.name}
          <ToolStatusBadge status={tool.status} />
        </span>
        <span className={styles.summary}>{tool.summary}</span>
      </span>
    </Link>
  );
}

export function BriefingLayout({ tools }: HomeLayoutProps) {
  const assets = useAssetsManifest();
  const hasAssets = assets.status === "success" && assets.data !== null;
  const featured = FEATURED.map((id) => tools.find((tool) => tool.id === id)).filter(
    (tool): tool is ToolDefinition => tool !== undefined,
  );
  const rest = tools.filter((tool) => !featured.includes(tool));

  return (
    <div className={styles.briefing}>
      {featured.length > 0 && (
        <section aria-label="Featured tools" className={styles.features}>
          {featured.map((tool) => (
            <FeatureCard key={tool.id} tool={tool} hasAssets={hasAssets} />
          ))}
        </section>
      )}
      {rest.length > 0 && (
        <section aria-label="More tools">
          <h2 className={styles.moreTitle}>More tools</h2>
          <ul className={styles.more}>
            {rest.map((tool) => (
              <li key={tool.id}>
                <Link to={`/${tool.id}`} className={styles.moreLink}>
                  <Icon name={toolIcon(tool)} size={18} className={styles.moreIcon} />
                  <span className={styles.moreName}>{tool.name}</span>
                  <ToolStatusBadge status={tool.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
