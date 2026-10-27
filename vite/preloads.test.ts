import { describe, expect, it } from "vitest";
import { fontPreloadFiles, heroImageHref, insertAfterHeadMeta } from "./preloads";

const hero = "icons/UI/Shared/Icons/Vendor/Weapons/T_UI_Vendor_WEPN_001v2.png";
const manifest = { schemaVersion: 1, build: "25937608", worlds: { kavkazi: { maxZoom: 6 } }, icons: true };

describe("heroImageHref", () => {
  it("points at the webp file when the manifest says the icons are webp", () => {
    expect(heroImageHref(hero, { ...manifest, iconFormat: "webp" })).toBe(
      "./assets/icons/UI/Shared/Icons/Vendor/Weapons/T_UI_Vendor_WEPN_001v2.webp",
    );
  });

  it("swaps the extension case-insensitively", () => {
    expect(heroImageHref("icons/Weapons/AK74M.PNG", { ...manifest, iconFormat: "webp" })).toBe(
      "./assets/icons/Weapons/AK74M.webp",
    );
  });

  it("keeps the stored path when the manifest has no icon format", () => {
    expect(heroImageHref(hero, manifest)).toBe(`./assets/${hero}`);
  });

  it("keeps the stored path when the icons are png", () => {
    expect(heroImageHref(hero, { ...manifest, iconFormat: "png" })).toBe(`./assets/${hero}`);
  });

  it("returns null when no manifest is synced", () => {
    expect(heroImageHref(hero, null)).toBeNull();
    expect(heroImageHref(hero, undefined)).toBeNull();
  });

  it("returns null for a malformed manifest", () => {
    expect(heroImageHref(hero, "webp")).toBeNull();
    expect(heroImageHref(hero, 42)).toBeNull();
    expect(heroImageHref(hero, [manifest])).toBeNull();
  });
});

describe("fontPreloadFiles", () => {
  const bundle = [
    "assets/index-C67lJMdQ.js",
    "assets/index-Cbt1F3Qm.css",
    "assets/barlow-latin-500-normal-BPAOfeC8.woff2",
    "assets/barlow-latin-400-normal-fsAxiSwU.woff",
    "assets/barlow-condensed-latin-700-normal-v1xN8_Wq.woff2",
    "assets/barlow-latin-400-normal-qiz4-Cze.woff2",
    "assets/barlow-condensed-latin-600-normal-DepVgxBB.woff2",
    "assets/barlow-condensed-latin-600-normal-B3zI4Yr2.woff",
    "assets/ui-BcUsTsgD.js",
  ];

  it("picks the woff2 files for Barlow 400 and Barlow Condensed 600 and 700, sorted", () => {
    expect(fontPreloadFiles(bundle)).toEqual([
      "assets/barlow-condensed-latin-600-normal-DepVgxBB.woff2",
      "assets/barlow-condensed-latin-700-normal-v1xN8_Wq.woff2",
      "assets/barlow-latin-400-normal-qiz4-Cze.woff2",
    ]);
  });

  it("skips fonts that are missing from the bundle", () => {
    expect(
      fontPreloadFiles(bundle.filter((fileName) => !fileName.includes("barlow-condensed-latin-700-normal"))),
    ).toEqual([
      "assets/barlow-condensed-latin-600-normal-DepVgxBB.woff2",
      "assets/barlow-latin-400-normal-qiz4-Cze.woff2",
    ]);
    expect(fontPreloadFiles([])).toEqual([]);
  });
});

describe("insertAfterHeadMeta", () => {
  const html = [
    "<!doctype html>",
    '<html lang="en">',
    "  <head>",
    '    <meta charset="UTF-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    "    <title>warpuppywiki</title>",
    '    <script type="module" crossorigin src="./assets/index-Cs6DU4uM.js"></script>',
    "  </head>",
    "</html>",
  ].join("\n");
  const tags = [
    '<link rel="preload" as="image" href="./assets/a.png">',
    '<link rel="preload" as="font" href="./b.woff2">',
  ];

  it("inserts the tags after the viewport meta tag with its indentation", () => {
    expect(insertAfterHeadMeta(html, tags).split("\n").slice(3, 7)).toEqual([
      '    <meta charset="UTF-8" />',
      '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      '    <link rel="preload" as="image" href="./assets/a.png">',
      '    <link rel="preload" as="font" href="./b.woff2">',
    ]);
  });

  it("falls back to the charset meta tag when there is no viewport meta tag", () => {
    const withoutViewport = html.replace(/\n.*name="viewport".*/, "");
    expect(insertAfterHeadMeta(withoutViewport, tags).split("\n").slice(3, 5)).toEqual([
      '    <meta charset="UTF-8" />',
      '    <link rel="preload" as="image" href="./assets/a.png">',
    ]);
  });

  it("falls back to the head tag when there are no meta tags", () => {
    expect(insertAfterHeadMeta("<html><head><title>x</title></head></html>", tags.slice(0, 1))).toBe(
      '<html><head>\n<link rel="preload" as="image" href="./assets/a.png"><title>x</title></head></html>',
    );
  });

  it("leaves the html unchanged when there is nothing to insert or no head", () => {
    expect(insertAfterHeadMeta(html, [])).toBe(html);
    expect(insertAfterHeadMeta("<p>no head</p>", tags)).toBe("<p>no head</p>");
  });
});
