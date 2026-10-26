import { z } from "zod";
import { BuildHeader, Bounds, Vec2, Vec3 } from "./common";

export const MapFile = BuildHeader.extend({
  id: z.string(),
  name: z.string(),
  world: z.string(),
  units: z.string(),
  bounds: Bounds,
  image: z.looseObject({
    width: z.number(),
    height: z.number(),
    metersPerPixel: z.number(),
    padding: z.looseObject({
      right: z.number(),
      bottom: z.number(),
    }),
  }),
  tiles: z.looseObject({
    size: z.number(),
    minZoom: z.number(),
    maxZoom: z.number(),
    format: z.string(),
    urlTemplate: z.string(),
  }),
});

export const TerrainFile = BuildHeader.extend({
  id: z.string(),
  world: z.string(),
  units: z.string(),
  bounds: Bounds,
  zRange: z.looseObject({
    min: z.number(),
    max: z.number(),
  }),
  heightmap: z.looseObject({
    file: z.string(),
    width: z.number(),
    height: z.number(),
    bitDepth: z.number(),
    metersPerPixel: Vec2,
    encoding: z.string(),
  }),
  check: z.looseObject({
    buildings: z.number(),
    medianOffset: z.number(),
    p5Offset: z.number(),
    p95Offset: z.number(),
    fractionWithin5m: z.number(),
  }),
});

export const Building = z.looseObject({
  id: z.string(),
  kind: z.enum(["bungalow", "house", "apartment", "warehouse", "market", "shop", "garage", "office", "supply", "pool"]),
  class: z.string(),
  min: Vec3,
  max: Vec3,
  parts: z.number(),
});

export const BuildingsFile = BuildHeader.extend({
  world: z.string(),
  units: z.string(),
  shape: z.string(),
  count: z.number(),
  buildings: z.array(Building),
});

export const ObjectiveZone = z.looseObject({
  center: Vec3,
  extents: Vec3,
  shape: z.string().nullish(),
  hotZone: z.looseObject({
    extents: Vec3,
    shape: z.string().nullish(),
  }),
});

export const ObjectiveConfig = z.looseObject({
  config: z.string(),
  mode: z.string(),
  zone: ObjectiveZone,
  alternatives: z.array(
    z.looseObject({
      id: z.string(),
      weight: z.number(),
      zone: ObjectiveZone,
    }),
  ),
  hotZoneMovement: z.looseObject({
    firstMoveDelay: z.number().nullish(),
    moveDelay: z.number().nullish(),
    innerRadiusFraction: z.number().nullish(),
    defaultSpeed: z.number().nullish(),
    dynamicSpeeds: z.boolean().nullish(),
    speeds: z.array(z.number()),
    minMoveDistance: z.number().nullish(),
  }),
});

export const ObjectivesFile = BuildHeader.extend({
  world: z.string(),
  units: z.string(),
  configs: z.array(ObjectiveConfig),
});

export const MapObject = z.looseObject({
  id: z.string(),
  kind: z.enum([
    "equipment-vendor",
    "vehicle-vendor",
    "garage-vendor",
    "safe-zone",
    "safe-zone-camera",
    "spawn-manager",
    "spawn-volume",
    "vehicle-deployment-board",
    "fuel-refill",
  ]),
  class: z.string(),
  position: Vec3,
  yaw: z.number().nullish(),
  scale: Vec3.nullish(),
  faction: z.string().nullish(),
  tags: z.array(z.string()).nullish(),
  allowedVehicles: z.array(z.string()).nullish(),
  disallowedVehicles: z.array(z.string()).nullish(),
});

export const ObjectsFile = BuildHeader.extend({
  world: z.string(),
  units: z.string(),
  count: z.number(),
  objects: z.array(MapObject),
});
