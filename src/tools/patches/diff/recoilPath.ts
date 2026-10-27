import { isRecord } from "./deepDiff";

export interface RecoilPoint {
  x: number;
  y: number;
}

export function cumulativeRecoil(pattern: unknown): RecoilPoint[] {
  if (!Array.isArray(pattern)) {
    return [];
  }
  const points: RecoilPoint[] = [{ x: 0, y: 0 }];
  for (const shot of pattern) {
    if (isRecord(shot) && typeof shot.x === "number" && typeof shot.y === "number") {
      const last = points[points.length - 1]!;
      points.push({ x: last.x + shot.x, y: last.y + shot.y });
    }
  }
  return points.length > 1 ? points : [];
}
