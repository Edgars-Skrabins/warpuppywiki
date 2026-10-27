import { EMPTY_VALUE } from "@/ui";

const UNITS: readonly { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
  { unit: "year", seconds: 365 * 24 * 3600 },
  { unit: "month", seconds: 30 * 24 * 3600 },
  { unit: "week", seconds: 7 * 24 * 3600 },
  { unit: "day", seconds: 24 * 3600 },
  { unit: "hour", seconds: 3600 },
  { unit: "minute", seconds: 60 },
];

const JUST_NOW_SECONDS = 45;

const format = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

export function relativeTime(from: Date, now: Date): string {
  const elapsed = (now.getTime() - from.getTime()) / 1000;
  if (Number.isNaN(elapsed)) {
    return EMPTY_VALUE;
  }
  if (Math.abs(elapsed) < JUST_NOW_SECONDS) {
    return "just now";
  }
  for (const { unit, seconds } of UNITS) {
    if (Math.abs(elapsed) >= seconds) {
      return format.format(-Math.round(elapsed / seconds), unit);
    }
  }
  return format.format(-Math.max(1, Math.round(elapsed / 60)), "minute");
}
