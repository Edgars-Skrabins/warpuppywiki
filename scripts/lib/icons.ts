import sharp from "sharp";

const ICON_MAX_SIZE = 320;

export function convertIcon(png: Buffer): Promise<Buffer> {
  return sharp(png)
    .resize({ width: ICON_MAX_SIZE, height: ICON_MAX_SIZE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90, alphaQuality: 100 })
    .toBuffer();
}

export function iconTargetPath(path: string): string {
  return path.replace(/\.png$/i, ".webp");
}
