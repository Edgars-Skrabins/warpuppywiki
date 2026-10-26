import { z } from "zod";

export const AssetsManifest = z.looseObject({
  schemaVersion: z.literal(1),
  build: z.string(),
  worlds: z.record(z.string(), z.looseObject({ maxZoom: z.number() })),
  icons: z.boolean(),
});
