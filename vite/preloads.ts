import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import type { Plugin } from "vite";
import { HERO_ART_PATH } from "../src/app/pages/home/featuredArt.ts";

const FONT_PRELOADS = [
  "barlow-latin-400-normal",
  "barlow-condensed-latin-600-normal",
  "barlow-condensed-latin-700-normal",
] as const;

export function heroImageHref(storedPath: string, manifest: unknown): string | null {
  if (typeof manifest !== "object" || manifest === null || Array.isArray(manifest)) {
    return null;
  }
  const iconFormat = (manifest as { iconFormat?: unknown }).iconFormat;
  const path = iconFormat === "webp" ? storedPath.replace(/\.png$/i, ".webp") : storedPath;
  return `./assets/${path}`;
}

export function fontPreloadFiles(fileNames: readonly string[]): string[] {
  return fileNames
    .filter((fileName) => {
      const name = basename(fileName);
      return name.endsWith(".woff2") && FONT_PRELOADS.some((prefix) => name.startsWith(prefix));
    })
    .sort();
}

const INSERT_AFTER = [/^([ \t]*)<meta\s+name="viewport"[^>]*>/im, /^([ \t]*)<meta\s+charset[^>]*>/im, /<head[^>]*>/i];

export function insertAfterHeadMeta(html: string, tags: readonly string[]): string {
  if (tags.length === 0) {
    return html;
  }
  for (const pattern of INSERT_AFTER) {
    const match = pattern.exec(html);
    if (match !== null) {
      const indent = match[1] ?? "";
      const end = match.index + match[0].length;
      return `${html.slice(0, end)}${tags.map((tag) => `\n${indent}${tag}`).join("")}${html.slice(end)}`;
    }
  }
  return html;
}

function readAssetsManifest(publicDir: string): unknown {
  const file = join(publicDir, "assets", "manifest.json");
  if (!existsSync(file)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export function preloadsPlugin(): Plugin {
  let publicDir = "";
  return {
    name: "warpuppywiki-preloads",
    apply: "build",
    configResolved(config) {
      publicDir = config.publicDir;
    },
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        const tags: string[] = [];
        const heroHref = heroImageHref(HERO_ART_PATH, readAssetsManifest(publicDir));
        if (heroHref !== null) {
          tags.push(`<link rel="preload" as="image" href="${heroHref}" fetchpriority="high">`);
        }
        for (const fileName of fontPreloadFiles(Object.keys(ctx.bundle ?? {}))) {
          tags.push(`<link rel="preload" as="font" type="font/woff2" href="./${fileName}" crossorigin>`);
        }
        return insertAfterHeadMeta(html, tags);
      },
    },
  };
}
