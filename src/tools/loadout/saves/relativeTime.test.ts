import { describe, expect, it } from "vitest";
import { relativeTime } from "./relativeTime";

const now = new Date("2026-10-27T12:00:00.000Z");

function ago(seconds: number): Date {
  return new Date(now.getTime() - seconds * 1000);
}

describe("relativeTime", () => {
  it("says just now for the last few seconds", () => {
    expect(relativeTime(ago(10), now)).toBe("just now");
  });

  it("counts minutes, hours and days", () => {
    expect(relativeTime(ago(50), now)).toBe("1 minute ago");
    expect(relativeTime(ago(5 * 60), now)).toBe("5 minutes ago");
    expect(relativeTime(ago(2 * 3600), now)).toBe("2 hours ago");
    expect(relativeTime(ago(24 * 3600), now)).toBe("yesterday");
    expect(relativeTime(ago(3 * 24 * 3600), now)).toBe("3 days ago");
  });

  it("shows a dash for an invalid date", () => {
    expect(relativeTime(new Date("not a date"), now)).toBe("—");
  });
});
