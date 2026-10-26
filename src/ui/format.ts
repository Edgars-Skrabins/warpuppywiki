export const EMPTY_VALUE = "—";

const MINUS = "−";

type Numeric = number | null | undefined;

const numberFormats = new Map<number, Intl.NumberFormat>();

function numberFormat(maxFractionDigits: number): Intl.NumberFormat {
  let format = numberFormats.get(maxFractionDigits);
  if (!format) {
    format = new Intl.NumberFormat("en-US", { maximumFractionDigits: maxFractionDigits });
    numberFormats.set(maxFractionDigits, format);
  }
  return format;
}

const cashFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

function isMissing(n: Numeric): n is null | undefined {
  return n === null || n === undefined || Number.isNaN(n);
}

function withMinus(text: string): string {
  return text.replace("-", MINUS);
}

export function formatNumber(n: Numeric, { maxFractionDigits = 2 }: { maxFractionDigits?: number } = {}): string {
  if (isMissing(n)) return EMPTY_VALUE;
  return withMinus(numberFormat(maxFractionDigits).format(n));
}

export function formatCash(n: Numeric, { zeroAsFree = false }: { zeroAsFree?: boolean } = {}): string {
  if (isMissing(n)) return EMPTY_VALUE;
  if (zeroAsFree && n === 0) return "Free";
  return withMinus(cashFormat.format(n));
}

export function formatDistance(m: Numeric): string {
  if (isMissing(m)) return EMPTY_VALUE;
  if (Math.abs(m) >= 1000) return `${formatNumber(m / 1000, { maxFractionDigits: 2 })} km`;
  return `${formatNumber(m, { maxFractionDigits: 1 })} m`;
}

export function formatSeconds(s: Numeric, { ms = false }: { ms?: boolean } = {}): string {
  if (isMissing(s)) return EMPTY_VALUE;
  if (ms && Math.abs(s) < 1) return `${formatNumber(s * 1000, { maxFractionDigits: 0 })} ms`;
  return `${formatNumber(s, { maxFractionDigits: 2 })} s`;
}

export function formatPercent(fraction: Numeric, { signed = false }: { signed?: boolean } = {}): string {
  if (isMissing(fraction)) return EMPTY_VALUE;
  const text = `${formatNumber(Math.abs(fraction) * 100, { maxFractionDigits: 1 })}%`;
  return signText(fraction, text, signed);
}

export function formatMultiplier(m: Numeric): string {
  if (isMissing(m)) return EMPTY_VALUE;
  return `×${formatNumber(m, { maxFractionDigits: 2 })}`;
}

export function formatWeight(kg: Numeric): string {
  if (isMissing(kg)) return EMPTY_VALUE;
  return `${formatNumber(kg, { maxFractionDigits: 2 })} kg`;
}

function signText(value: number, magnitudeText: string, signed: boolean): string {
  if (value < 0) return `${MINUS}${magnitudeText}`;
  if (signed && value > 0) return `+${magnitudeText}`;
  return magnitudeText;
}

export type DeltaKind =
  "number" | "cash" | "distance" | "seconds" | "milliseconds" | "percent" | "multiplier" | "weight";

export type DeltaFormat = DeltaKind | ((magnitude: number) => string);

export type DeltaDirection = "up" | "down" | "none";

export interface FormattedDelta {
  text: string;
  direction: DeltaDirection;
}

const magnitudeFormatters: Record<DeltaKind, (magnitude: number) => string> = {
  number: (magnitude) => formatNumber(magnitude),
  cash: (magnitude) => formatCash(magnitude),
  distance: (magnitude) => formatDistance(magnitude),
  seconds: (magnitude) => formatSeconds(magnitude),
  milliseconds: (magnitude) => formatSeconds(magnitude, { ms: true }),
  percent: (magnitude) => formatPercent(magnitude),
  multiplier: (magnitude) => formatNumber(magnitude),
  weight: (magnitude) => formatWeight(magnitude),
};

export function formatDelta(from: Numeric, to: Numeric, kind: DeltaFormat): FormattedDelta {
  if (isMissing(from) || isMissing(to)) return { text: EMPTY_VALUE, direction: "none" };
  const format = typeof kind === "function" ? kind : magnitudeFormatters[kind];
  const diff = to - from;
  const tolerance = 1e-9 * Math.max(1, Math.abs(from), Math.abs(to));
  if (Math.abs(diff) <= tolerance) return { text: format(0), direction: "none" };
  const magnitudeText = format(Math.abs(diff));
  return diff > 0
    ? { text: `+${magnitudeText}`, direction: "up" }
    : { text: `${MINUS}${magnitudeText}`, direction: "down" };
}
