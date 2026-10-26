import { deflateSync, inflateSync, strFromU8, strToU8 } from "fflate";
import type { z } from "zod";
import { decodeBase64Url, encodeBase64Url } from "./base64url";

export const MAX_URL_STATE_LENGTH = 2000;

export interface UrlStateCodec<T> {
  key: string;
  version: number;
  schema: z.ZodType<T>;
  defaults: T;
  migrate?: Record<number, (old: unknown) => unknown>;
}

export interface DecodedState<T> {
  state: T;
  error: boolean;
}

export class StateTooLargeError extends Error {
  readonly length: number;

  constructor(length: number) {
    super(`Encoded state is ${length} characters, above the limit of ${MAX_URL_STATE_LENGTH}`);
    this.name = "StateTooLargeError";
    this.length = length;
  }
}

const PREFIX = /^(\d+)\.(.*)$/s;

export function defineUrlState<T>(codec: UrlStateCodec<T>): UrlStateCodec<T> {
  return codec;
}

export function encodeState<T>(codec: UrlStateCodec<T>, state: T): string {
  const payload = encodeBase64Url(deflateSync(strToU8(JSON.stringify(state)), { level: 9 }));
  const text = `${codec.version}.${payload}`;
  if (text.length > MAX_URL_STATE_LENGTH) {
    throw new StateTooLargeError(text.length);
  }
  return text;
}

export function decodeState<T>(codec: UrlStateCodec<T>, text: string | null | undefined): DecodedState<T> {
  if (text === null || text === undefined || text === "") {
    return { state: codec.defaults, error: false };
  }
  const fallback = { state: codec.defaults, error: true };
  const match = PREFIX.exec(text);
  if (!match) {
    return fallback;
  }
  const version = Number(match[1]);
  if (version > codec.version) {
    return fallback;
  }
  let value: unknown;
  try {
    value = JSON.parse(strFromU8(inflateSync(decodeBase64Url(match[2] ?? ""))));
  } catch {
    return fallback;
  }
  for (let from = version; from < codec.version; from++) {
    const step = codec.migrate?.[from];
    if (!step) {
      return fallback;
    }
    try {
      value = step(value);
    } catch {
      return fallback;
    }
  }
  const parsed = codec.schema.safeParse(value);
  return parsed.success ? { state: parsed.data, error: false } : fallback;
}
