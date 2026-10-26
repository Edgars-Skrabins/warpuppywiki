export const LOS_NOTES: readonly string[] = [
  "Terrain comes from a heightmap with about 8 m per pixel and is sampled every 2 m along the line by default, so narrow ridges can be missed.",
  "Buildings are boxes that enclose the whole building, so they can block lines that would really pass a roof edge or a gap.",
  "Destroyed buildings are not modeled.",
];
