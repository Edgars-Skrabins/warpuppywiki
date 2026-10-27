import { encode } from "fast-png";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { convertIcon, iconTargetPath } from "./icons";

function transparentPng(width: number, height: number): Buffer {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const inside = x > width / 4 && x < (width * 3) / 4 && y > height / 4 && y < (height * 3) / 4;
      data[i] = 200;
      data[i + 1] = 120;
      data[i + 2] = 40;
      data[i + 3] = inside ? 255 : 0;
    }
  }
  return Buffer.from(encode({ width, height, data, channels: 4, depth: 8 }));
}

describe("convertIcon", () => {
  it("downscales a 512 x 512 icon to 320 x 320 WebP and keeps transparency", async () => {
    const webp = await convertIcon(transparentPng(512, 512));
    const meta = await sharp(webp).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(320);
    expect(meta.height).toBe(320);
    expect(meta.hasAlpha).toBe(true);
    const { data, info } = await sharp(webp).raw().toBuffer({ resolveWithObject: true });
    expect(data[3]).toBe(0);
    expect(data[(160 * info.width + 160) * 4 + 3]).toBe(255);
  });

  it("keeps the size of an icon smaller than the cap", async () => {
    const meta = await sharp(await convertIcon(transparentPng(144, 144))).metadata();
    expect(meta.width).toBe(144);
    expect(meta.height).toBe(144);
  });

  it("keeps the aspect ratio of a wide icon", async () => {
    const meta = await sharp(await convertIcon(transparentPng(426, 272))).metadata();
    expect(meta.width).toBe(320);
    expect(meta.height).toBe(204);
  });

  it("rejects a file that is not an image", async () => {
    await expect(convertIcon(Buffer.from("not a png"))).rejects.toThrow();
  });
});

describe("iconTargetPath", () => {
  it("swaps a .png extension for .webp in any case", () => {
    expect(iconTargetPath("icons/items/rifle.png")).toBe("icons/items/rifle.webp");
    expect(iconTargetPath("icons/items/rifle.PNG")).toBe("icons/items/rifle.webp");
  });

  it("leaves other extensions alone", () => {
    expect(iconTargetPath("icons/items/rifle.webp")).toBe("icons/items/rifle.webp");
    expect(iconTargetPath("icons/items/png.jpg")).toBe("icons/items/png.jpg");
  });
});
