import type { RewardCurve } from "@/core/data";

export function curveLookup(curves: readonly RewardCurve[]): (id: string) => RewardCurve | undefined {
  const byId = new Map(curves.map((curve) => [curve.id.toLowerCase(), curve]));
  return (id) => byId.get(id.toLowerCase());
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

export function curveValue(curve: RewardCurve, input: number): number {
  const points = [...curve.points].sort((a, b) => a.input - b.input);
  const first = points[0];
  if (!first) {
    return 0;
  }
  if (input <= first.input) {
    return first.value;
  }
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index]!;
    const to = points[index + 1]!;
    if (input < to.input) {
      const t = (input - from.input) / (to.input - from.input);
      switch (from.interpolation) {
        case "constant":
          return from.value;
        case "linear":
          return from.value + (to.value - from.value) * t;
        case "cubic":
          return from.value + (to.value - from.value) * smoothstep(t);
      }
    }
  }
  return points[points.length - 1]!.value;
}

export interface CurvePoint {
  input: number;
  value: number;
}

const SAMPLES_PER_SEGMENT = 8;
const STEP_OFFSET = 1e-6;

export function curvePoints(curve: RewardCurve, until: number): CurvePoint[] {
  const points = [...curve.points].sort((a, b) => a.input - b.input);
  const result: CurvePoint[] = [];
  points.forEach((from, index) => {
    const to = points[index + 1];
    result.push({ input: from.input, value: from.value });
    if (!to) {
      return;
    }
    const span = to.input - from.input;
    if (from.interpolation === "constant") {
      result.push({ input: to.input - span * STEP_OFFSET, value: from.value });
      return;
    }
    for (let step = 1; step < SAMPLES_PER_SEGMENT; step += 1) {
      const input = from.input + (span * step) / SAMPLES_PER_SEGMENT;
      result.push({ input, value: curveValue(curve, input) });
    }
  });
  const last = points[points.length - 1];
  if (last && until > last.input) {
    result.push({ input: until, value: last.value });
  }
  return result;
}
