import { z } from "zod";
import { BuildHeader } from "./common";

export const LootTable = z.looseObject({
  id: z.string(),
  spawnChance: z.number(),
  spawnByDefault: z.boolean().nullish(),
  spawnByPoints: z.boolean().nullish(),
  initialSpawnTime: z.number().nullish(),
  initialSpawnPoints: z.number().nullish(),
  canRespawn: z.boolean().nullish(),
  respawnTime: z.number().nullish(),
  neverSelectPreviousItem: z.boolean().nullish(),
  spawnInsideControlZoneOnly: z.boolean().nullish(),
  items: z.array(
    z.looseObject({
      item: z.string(),
      amount: z.number(),
      weight: z.number(),
      subItems: z.array(
        z.looseObject({
          item: z.string(),
          chance: z.number(),
          amount: z.number(),
        }),
      ),
    }),
  ),
});

export const LootFile = BuildHeader.extend({
  tables: z.array(LootTable),
});
