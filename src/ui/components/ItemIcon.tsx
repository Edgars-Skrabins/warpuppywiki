import { useState } from "react";
import { useAssetsManifest } from "@/core/data";
import { classNames } from "./classNames";
import styles from "./ItemIcon.module.css";

export interface ItemIconProps {
  icon?: string | null;
  name: string;
  size?: number;
  shape?: "wide" | "square";
  className?: string;
}

function initials(name: string): string {
  const words = name.match(/[\p{L}\p{N}]+/gu) ?? [];
  const [first = "", second] = words;
  return (second === undefined ? first.slice(0, 2) : `${first[0]}${second[0]}`).toUpperCase() || "?";
}

export function ItemIcon({ icon, name, size = 48, shape = "square", className }: ItemIconProps) {
  const manifest = useAssetsManifest();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = icon ? `${import.meta.env.BASE_URL}assets/icons/${icon}` : null;
  const showImage =
    src !== null && src !== failedSrc && manifest.status === "success" && manifest.data !== null && manifest.data.icons;
  const style = { height: size, width: shape === "wide" ? undefined : size };

  return (
    <span className={classNames(styles.icon, styles[shape], className)} style={style}>
      {showImage ? (
        <img src={src} alt={name} className={styles.image} loading="lazy" onError={() => setFailedSrc(src)} />
      ) : (
        <span
          role="img"
          aria-label={name}
          className={styles.placeholder}
          style={{ fontSize: Math.max(10, size * 0.34) }}
        >
          {initials(name)}
        </span>
      )}
    </span>
  );
}
