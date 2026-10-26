import { describe, expect, it } from "vitest";
import { decodeBase64Url, encodeBase64Url } from "./base64url";

describe("base64url", () => {
  it("round-trips every byte value", () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, i) => i);
    expect(decodeBase64Url(encodeBase64Url(bytes))).toEqual(bytes);
  });

  it("replaces the characters that standard base64 uses for +, / and padding", () => {
    const bytes = Uint8Array.from([0xfb, 0xff, 0xbf, 0xfe]);
    expect(btoa(String.fromCharCode(...bytes))).toBe("+/+//g==");
    const encoded = encodeBase64Url(bytes);
    expect(encoded).toBe("-_-__g");
    expect(decodeBase64Url(encoded)).toEqual(bytes);
  });

  it("round-trips lengths that need one or two padding characters", () => {
    for (const length of [0, 1, 2, 3, 4, 5]) {
      const bytes = Uint8Array.from({ length }, (_, i) => 250 - i);
      expect(decodeBase64Url(encodeBase64Url(bytes))).toEqual(bytes);
    }
  });

  it("rejects text outside the base64url alphabet", () => {
    expect(() => decodeBase64Url("ab+c")).toThrow();
    expect(() => decodeBase64Url("abc=")).toThrow();
    expect(() => decodeBase64Url("abcde")).toThrow();
  });
});
